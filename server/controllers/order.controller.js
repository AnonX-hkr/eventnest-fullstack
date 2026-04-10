const { validationResult } = require("express-validator");
const QRCode = require("qrcode");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const { sendTicketEmail } = require("../utils/email");
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendValidationError,
  sendNotFound,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders  — create order + generate QR-coded tickets
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const { eventId, lines, billingInfo } = req.body;

    // ── Fetch & validate event ────────────────────────────────────────────────
    const event = await Event.findById(eventId);
    if (!event) return sendNotFound(res, "Event");
    if (event.status !== "published") {
      return sendError(res, "This event is not available for booking.", 400);
    }

    // ── Validate tiers & build line items ────────────────────────────────────
    let subtotal = 0;
    const processedLines = [];

    for (const line of lines) {
      const tier = event.ticketTiers.id(line.tierId);
      if (!tier) {
        return sendError(res, `Ticket tier not found: ${line.tierId}`, 400);
      }

      const available = tier.quantity - (tier.sold || 0);
      if (line.quantity < 1) {
        return sendError(res, `Quantity must be at least 1 for ${tier.name}`, 400);
      }
      if (line.quantity > available) {
        return sendError(res, `Only ${available} ticket(s) left for "${tier.name}".`, 409);
      }
      if (tier.maxPerOrder && line.quantity > tier.maxPerOrder) {
        return sendError(res, `Max ${tier.maxPerOrder} ticket(s) per order for "${tier.name}".`, 400);
      }

      const lineSubtotal = tier.price * line.quantity;
      subtotal += lineSubtotal;
      processedLines.push({
        tierId: tier._id,
        tierName: tier.name,
        tierType: tier.type,
        unitPrice: tier.price,
        quantity: line.quantity,
        subtotal: lineSubtotal,
      });
    }

    const serviceFeeRate = 0.08;
    const serviceFee = Math.round(subtotal * serviceFeeRate * 100) / 100;
    const total = Math.round((subtotal + serviceFee) * 100) / 100;

    // ── Create order ─────────────────────────────────────────────────────────
    const order = await Order.create({
      buyer: req.user._id,
      event: eventId,
      lines: processedLines,
      subtotal,
      serviceFee,
      serviceFeeRate,
      total,
      billingInfo,
      status: "confirmed",
      confirmedAt: new Date(),
      payment: { method: "free", paidAt: new Date() },
    });

    // ── Issue tickets with QR codes ───────────────────────────────────────────
    const issuedTickets = [];

    for (const line of processedLines) {
      for (let i = 0; i < line.quantity; i++) {
        // Save first to get the auto-generated ticketCode
        const ticket = new Ticket({
          event: eventId,
          order: order._id,
          attendee: req.user._id,
          tierSnapshot: {
            tierId: line.tierId,
            name: line.tierName,
            type: line.tierType,
            price: line.unitPrice,
          },
          attendeeInfo: {
            name: billingInfo.name,
            email: billingInfo.email,
            phone: billingInfo.phone || "",
          },
        });
        await ticket.save();

        // Generate QR encoding ticketId + ticketCode for tamper evidence
        const qrPayload = JSON.stringify({
          ticketId: ticket._id.toString(),
          ticketCode: ticket.ticketCode,
          eventId: eventId.toString(),
        });
        ticket.qrPayload = await QRCode.toDataURL(qrPayload, {
          width: 320,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        await ticket.save();

        issuedTickets.push(ticket);
      }
    }

    // ── Link tickets to order ─────────────────────────────────────────────────
    order.tickets = issuedTickets.map((t) => t._id);
    await order.save();

    // ── Update event sold counters ────────────────────────────────────────────
    const totalSold = processedLines.reduce((s, l) => s + l.quantity, 0);
    await Event.findByIdAndUpdate(eventId, { $inc: { totalSold } });

    for (const line of processedLines) {
      await Event.findOneAndUpdate(
        { _id: eventId, "ticketTiers._id": line.tierId },
        { $inc: { "ticketTiers.$.sold": line.quantity } }
      );
    }

    // ── Send confirmation email (fire-and-forget, never blocks) ──────────────
    sendTicketEmail({
      to: billingInfo.email,
      order: {
        orderNumber: order.orderNumber,
        total: order.total,
        subtotal: order.subtotal,
        serviceFee: order.serviceFee,
        confirmedAt: order.confirmedAt,
      },
      tickets: issuedTickets,
      event: {
        title: event.title,
        startDate: event.startDate,
        venue: event.venue,
        coverImage: event.coverImage,
      },
      buyerName: billingInfo.name,
    }).catch(() => {}); // email errors must not fail the order response

    return sendCreated(
      res,
      {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          serviceFee: order.serviceFee,
          total: order.total,
          status: order.status,
          confirmedAt: order.confirmedAt,
        },
        tickets: issuedTickets.map((t) => ({
          _id: t._id,
          ticketCode: t.ticketCode,
          qrPayload: t.qrPayload,
          tierSnapshot: t.tierSnapshot,
          attendeeInfo: t.attendeeInfo,
          status: t.status,
        })),
        event: {
          _id: event._id,
          title: event.title,
          startDate: event.startDate,
          venue: event.venue,
          coverImage: event.coverImage,
        },
      },
      "Order confirmed! Your tickets are ready."
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my  — buyer's order history
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id, status: "confirmed" })
      .populate("event", "title startDate venue coverImage")
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, { orders });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/organizer-stats  — stats for organizer's events
// ─────────────────────────────────────────────────────────────────────────────
const getOrganizerStats = async (req, res, next) => {
  try {
    // Get all events owned by this organizer
    const organizerEvents = await Event.find({ organizer: req.user._id }).select("_id title totalSold");
    const eventIds = organizerEvents.map((e) => e._id);

    if (eventIds.length === 0) {
      return sendSuccess(res, {
        totalRevenue: 0,
        totalOrders: 0,
        totalTickets: 0,
        activeEvents: 0,
        recentOrders: [],
        monthlyRevenue: [],
      });
    }

    // Aggregate revenue from confirmed orders
    const [agg] = await Order.aggregate([
      { $match: { event: { $in: eventIds }, status: "confirmed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalTickets: {
            $sum: {
              $reduce: {
                input: "$lines",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.quantity"] },
              },
            },
          },
        },
      },
    ]);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          status: "confirmed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Recent orders
    const recentOrders = await Order.find({
      event: { $in: eventIds },
      status: "confirmed",
    })
      .populate("buyer", "name email")
      .populate("event", "title")
      .sort({ createdAt: -1 })
      .limit(8);

    const activeEvents = await Event.countDocuments({
      organizer: req.user._id,
      status: "published",
    });

    return sendSuccess(res, {
      totalRevenue: agg?.totalRevenue ?? 0,
      totalOrders: agg?.totalOrders ?? 0,
      totalTickets: agg?.totalTickets ?? 0,
      activeEvents,
      monthlyRevenue: monthlyRevenue.map((m) => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
        revenue: Math.round(m.revenue * 100) / 100,
        orders: m.orders,
      })),
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber,
        buyer: o.buyer,
        event: o.event,
        total: o.total,
        ticketCount: o.ticketCount,
        confirmedAt: o.confirmedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getOrganizerStats };
