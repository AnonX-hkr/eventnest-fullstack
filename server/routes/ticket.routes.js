const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getMyTickets, validateTicket } = require("../controllers/ticket.controller");

// GET /api/tickets/my  — attendee's tickets
router.get("/my", protect, getMyTickets);

// POST /api/tickets/validate  — scan & check in (organizer/staff)
router.post("/validate", protect, validateTicket);

module.exports = router;
