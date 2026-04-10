const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  createOrder,
  getMyOrders,
  getOrganizerStats,
} = require("../controllers/order.controller");

const createOrderRules = [
  body("eventId").notEmpty().isMongoId().withMessage("Valid event ID required"),
  body("lines").isArray({ min: 1 }).withMessage("At least one ticket line required"),
  body("lines.*.tierId").notEmpty().isMongoId().withMessage("Valid tier ID required"),
  body("lines.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("billingInfo.name").trim().notEmpty().withMessage("Billing name required"),
  body("billingInfo.email").trim().isEmail().withMessage("Valid billing email required"),
];

// POST /api/orders
router.post("/", protect, requireRole("attendee", "admin"), createOrderRules, createOrder);

// GET /api/orders/my
router.get("/my", protect, getMyOrders);

// GET /api/orders/organizer-stats
router.get("/organizer-stats", protect, requireRole("organizer", "admin"), getOrganizerStats);

module.exports = router;
