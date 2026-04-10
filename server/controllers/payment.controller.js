const QRCode = require("qrcode");
const { getStripe } = require("../utils/stripe");
const { sendTicketEmail } = require("../utils/email");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const User = require("../models/User");
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-session
// Creates a pending Order + Stripe Checkout Session and returns the URL.
// ─────────────────────────────────────────────────────────────────────────────
const createSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return sendError(res, "Payment provider not configured. Use the free checkout instead.", 503);
    }

    const { eventId, lines, billingInfo } = req.body;

    if (!eventId || !lines?.length || !billingInfo?.name || !billingInfo?.email) {
      return sendError(res, "Missing required fields: eventId, lines, billingInfo.", 400);
    }

    // ── Validate event ───────────────────────────────────────────────────────
    const event = await Event.findById(eventId);
    if (!event) return sendNotFound(res, "Event");
    if (event.status !== "published") {
      return sendError(res, "Event is not available for booking.", 400);
    }

    // ── Build line items ─────────────────────────────────────────────────────
    let subtotal = 0;
    const processedLines = [];
    const stripeLineItems = [];

    for (const line of lines) {
      const tier = event.ticketTiers.id(line.tierId);
      if (!tier) return sendError(res, `Tier not found: ${line.tierId}`, 400);

      const available = tier.quantity - (tier.sold || 0);
      if (line.quantity > available) {
        return sendError(res, `Only ${available} ticket(s) left for "${tier.name}".`, 409);
      }

      const lineSubtotal = tier.price * line.quantity;
      subtotal += lineSubtotal;

      processedLines.push({
        tierId: tier._id, tierName: tier.name, tierType: tier.type,
        unitPrice: tier.price, quantity: line.quantity, subtotal: lineSubtotal,
      });

      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tier.name} — ${event.title}`,
            description: `${tier.type} ticket · Qty: ${line.quantity}`,
          },
          unit_amount: Math.round(tier.price * 100), // cents
        },
        quantity: line.quantity,
      });
    }

    // Add service fee line
    const serviceFeeRate = 0.08;
    const serviceFee = Math.round(subtotal * serviceFeeRate * 100) / 100;
    const total = Math.round((subtotal + serviceFee) * 100) / 100;

    if (serviceFee > 0) {
      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Service Fee" },
          unit_amount: Math.round(serviceFee * 100),
        },
        quantity: 1,
      });
    }

    // ── Create PENDING order ─────────────────────────────────────────────────
    const order = await Order.create({
      buyer: req.user._id,
      event: eventId,
      lines: processedLines,
      subtotal,
      serviceFee,
      serviceFeeRate,
      total,
      billingInfo,
      status: "pending",
    });

    // ── Create Stripe Checkout Session ───────────────────────────────────────
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      customer_email: billingInfo.email,
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout?eventId=${eventId}`,
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        eventId: eventId.toString(),
      },
      payment_intent_data: {
        metadata: { orderId: order._id.toString() },
      },
    });

    // Store session ID on the order
    order.stripeSessionId = session.id;
    await order.save();

    return sendSuccess(res, {
      sessionId: session.id,
      url: session.url,
      orderId: order._id,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Stripe fires this after payment. Confirms order + issues tickets + sends email.
// MUST use raw body (registered before express.json in index.js).
// ─────────────────────────────────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type !== "checkout.session.completed") {
    return res.json({ received: true }); // Ignore other events
  }

  const session = event.data.object;
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error("[stripe-webhook] No orderId in session metadata");
    return res.status(400).json({ error: "Missing orderId in metadata" });
  }

  try {
    const order = await Order.findById(orderId).populate("event");
    if (!order) {
      console.error("[stripe-webhook] Order not found:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "confirmed") {
      return res.json({ received: true, note: "Already processed" });
    }

    // ── Confirm order ────────────────────────────────────────────────────────
    order.status = "confirmed";
    order.confirmedAt = new Date();
    order.stripePaymentIntentId = session.payment_intent;
    order.payment = {
      method: "card",
      provider: "stripe",
      transactionId: session.payment_intent,
      paidAt: new Date(),
    };

    // ── Issue tickets with QR codes ──────────────────────────────────────────
    const issuedTickets = [];
    const event = order.event;

    for (const line of order.lines) {
      for (let i = 0; i < line.quantity; i++) {
        const ticket = new Ticket({
          event: event._id,
          order: order._id,
          attendee: order.buyer,
          tierSnapshot: {
            tierId: line.tierId,
            name: line.tierName,
            type: line.tierType,
            price: line.unitPrice,
          },
          attendeeInfo: {
            name: order.billingInfo.name,
            email: order.billingInfo.email,
            phone: order.billingInfo.phone || "",
          },
        });
        await ticket.save();

        ticket.qrPayload = await QRCode.toDataURL(
          JSON.stringify({ ticketId: ticket._id.toString(), ticketCode: ticket.ticketCode, eventId: event._id.toString() }),
          { width: 320, margin: 2 }
        );
        await ticket.save();
        issuedTickets.push(ticket);
      }
    }

    order.tickets = issuedTickets.map((t) => t._id);
    await order.save();

    // ── Update event sold counts ─────────────────────────────────────────────
    const totalSold = order.lines.reduce((s, l) => s + l.quantity, 0);
    await Event.findByIdAndUpdate(event._id, { $inc: { totalSold } });
    for (const line of order.lines) {
      await Event.findOneAndUpdate(
        { _id: event._id, "ticketTiers._id": line.tierId },
        { $inc: { "ticketTiers.$.sold": line.quantity } }
      );
    }

    // ── Send confirmation email ──────────────────────────────────────────────
    const buyer = await User.findById(order.buyer).select("name email");
    await sendTicketEmail({
      to: order.billingInfo.email,
      order: { orderNumber: order.orderNumber, total: order.total },
      tickets: issuedTickets,
      event,
      buyerName: buyer?.name || order.billingInfo.name,
    });

    console.log(`[stripe-webhook] ✅ Order ${order.orderNumber} confirmed, ${issuedTickets.length} ticket(s) issued`);
    return res.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Processing error:", err);
    return res.status(500).json({ error: "Processing failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/session/:sessionId
// Frontend polls this after redirect from Stripe to get order + tickets.
// ─────────────────────────────────────────────────────────────────────────────
const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const order = await Order.findOne({ stripeSessionId: sessionId })
      .populate("event", "title startDate venue coverImage")
      .populate("tickets");

    if (!order) {
      return sendError(res, "Order not found for this session. It may still be processing — retry in a moment.", 404);
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return sendError(res, "Forbidden.", 403);
    }

    return sendSuccess(res, {
      status: order.status,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        serviceFee: order.serviceFee,
        total: order.total,
        status: order.status,
        confirmedAt: order.confirmedAt,
      },
      tickets: order.tickets,
      event: order.event,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession, handleWebhook, getSession };
