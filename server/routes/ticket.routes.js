const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getMyTickets, validateTicket, resendTicket } = require("../controllers/ticket.controller");

// GET /api/tickets/my  — attendee's tickets
router.get("/my", protect, getMyTickets);

// POST /api/tickets/validate  — scan & check in (organizer/staff)
router.post("/validate", protect, validateTicket);

// POST /api/tickets/:id/resend  — resend ticket email
router.post("/:id/resend", protect, resendTicket);

module.exports = router;
