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

// POST /api/promo-codes/validate — requires auth (any role)
router.post("/validate", protect, validatePromoCode);

// Organizer-only routes — protect + isOrganizer on each
router.post("/", protect, isOrganizer, createPromoCode);
router.get("/", protect, isOrganizer, listPromoCodes);
router.patch("/:id", protect, isOrganizer, updatePromoCode);
router.delete("/:id", protect, isOrganizer, deletePromoCode);

module.exports = router;
