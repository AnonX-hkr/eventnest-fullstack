const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { createSession, getSession } = require("../controllers/payment.controller");

// POST /api/payments/create-session  — authenticated buyer initiates checkout
router.post("/create-session", protect, createSession);

// GET /api/payments/session/:sessionId  — poll for order after Stripe redirect
router.get("/session/:sessionId", protect, getSession);

// NOTE: /api/payments/webhook is registered in index.js BEFORE express.json()
// to receive the raw body required for Stripe signature verification.

module.exports = router;
