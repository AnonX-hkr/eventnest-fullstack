const Ticket = require("../models/Ticket");
const {
  sendSuccess,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/my  — attendee's own tickets
// ─────────────────────────────────────────────────────────────────────────────
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ attendee: req.user._id })
      .populate("event", "title startDate endDate venue coverImage timezone")
      .populate("order", "orderNumber total confirmedAt")
      .sort({ createdAt: -1 });

    return sendSuccess(res, { tickets });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets/validate  — scan & check in (organizer/staff only)
// ─────────────────────────────────────────────────────────────────────────────
const validateTicket = async (req, res, next) => {
  try {
    const { ticketCode, ticketId, qrPayload } = req.body;

    if (!ticketCode && !ticketId && !qrPayload) {
      return sendError(res, "Provide ticketCode, ticketId, or qrPayload.", 400);
    }

    let ticket;

    // Parse QR payload if provided
    if (qrPayload) {
      try {
        const parsed = JSON.parse(qrPayload);
        ticket = await Ticket.findById(parsed.ticketId)
          .populate("event", "title startDate venue organizer")
          .populate("attendee", "name email");
      } catch {
        return sendError(res, "Invalid QR code payload.", 400);
      }
    } else if (ticketId) {
      ticket = await Ticket.findById(ticketId)
        .populate("event", "title startDate venue organizer")
        .populate("attendee", "name email");
    } else {
      ticket = await Ticket.findOne({ ticketCode: ticketCode.toUpperCase() })
        .populate("event", "title startDate venue organizer")
        .populate("attendee", "name email");
    }

    if (!ticket) return sendNotFound(res, "Ticket");

    // Only the event organizer or admin can validate
    const isOrganizer =
      ticket.event.organizer?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOrganizer && !isAdmin) {
      return sendError(res, "You are not authorized to validate tickets for this event.", 403);
    }

    // Already used
    if (ticket.status === "used") {
      return sendError(
        res,
        "Ticket already checked in.",
        409,
        [{ msg: `Checked in at: ${ticket.checkedInAt?.toISOString()}`, path: "status" }]
      );
    }

    if (ticket.status !== "valid") {
      return sendError(res, `Ticket status is "${ticket.status}" — cannot check in.`, 400);
    }

    // Check in
    await ticket.checkIn(req.user._id);

    return sendSuccess(
      res,
      {
        valid: true,
        ticket: {
          ticketCode: ticket.ticketCode,
          tierName: ticket.tierSnapshot.name,
          tierType: ticket.tierSnapshot.type,
          attendeeName: ticket.attendeeInfo.name,
          attendeeEmail: ticket.attendeeInfo.email,
          eventTitle: ticket.event.title,
          eventDate: ticket.event.startDate,
          checkedInAt: ticket.checkedInAt,
        },
      },
      "✅ Ticket validated — welcome!"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyTickets, validateTicket };
