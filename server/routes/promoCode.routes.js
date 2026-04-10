const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { isOrganizer } = require("../middleware/roles");
const {
  createPromoCode,
  listPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
} = require("../controllers/promoCode.controller");

// POST /api/promo-codes/validate  — public (called from checkout, auth optional)
router.post("/validate", protect, validatePromoCode);

// All other routes require organizer role
router.use(protect, isOrganizer);

// POST /api/promo-codes
router.post("/", createPromoCode);

// GET /api/promo-codes
router.get("/", listPromoCodes);

// PATCH /api/promo-codes/:id
router.patch("/:id", updatePromoCode);

// DELETE /api/promo-codes/:id
router.delete("/:id", deletePromoCode);

module.exports = router;
