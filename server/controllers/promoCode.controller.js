const PromoCode = require("../models/PromoCode");
const Event = require("../models/Event");
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/promo-codes  — organizer creates a promo code
// ─────────────────────────────────────────────────────────────────────────────
const createPromoCode = async (req, res, next) => {
  try {
    const {
      code,
      eventId,
      discountType,
      discountValue,
      usageLimit,
      expiresAt,
    } = req.body;

    if (!code || !discountType || discountValue == null) {
      return sendError(res, "code, discountType, and discountValue are required.", 400);
    }

    // Validate eventId belongs to organizer (if provided)
    if (eventId) {
      const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
      if (!event) {
        return sendError(res, "Event not found or you are not its organizer.", 404);
      }
    }

    const promo = await PromoCode.create({
      code: code.trim().toUpperCase(),
      event: eventId || null,
      organizer: req.user._id,
      discountType,
      discountValue: Number(discountValue),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return sendCreated(res, { promoCode: promo }, "Promo code created.");
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, "A promo code with this code already exists.", 409);
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/promo-codes  — list organizer's promo codes
// ─────────────────────────────────────────────────────────────────────────────
const listPromoCodes = async (req, res, next) => {
  try {
    const promoCodes = await PromoCode.find({ organizer: req.user._id })
      .populate("event", "title")
      .sort({ createdAt: -1 });

    return sendSuccess(res, { promoCodes });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/promo-codes/:id  — toggle active / update
// ─────────────────────────────────────────────────────────────────────────────
const updatePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });
    if (!promo) return sendNotFound(res, "PromoCode");

    const allowed = ["isActive", "usageLimit", "expiresAt", "discountValue", "discountType"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) promo[field] = req.body[field];
    });
    await promo.save();

    return sendSuccess(res, { promoCode: promo }, "Promo code updated.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/promo-codes/:id  — organizer deletes their promo code
// ─────────────────────────────────────────────────────────────────────────────
const deletePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findOneAndDelete({
      _id: req.params.id,
      organizer: req.user._id,
    });
    if (!promo) return sendNotFound(res, "PromoCode");

    return sendSuccess(res, null, "Promo code deleted.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/promo-codes/validate  — checkout validates & previews discount
// Body: { code, eventId, subtotal }
// Returns: { valid, discountAmount, discountType, discountValue, promoCodeId }
// ─────────────────────────────────────────────────────────────────────────────
const validatePromoCode = async (req, res, next) => {
  try {
    const { code, eventId, subtotal } = req.body;

    if (!code) return sendError(res, "Promo code is required.", 400);
    if (subtotal == null || subtotal < 0) return sendError(res, "Valid subtotal is required.", 400);

    // Look for a code that applies to this event OR is global (event: null)
    const promo = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      $or: [
        { event: eventId || null },
        { event: null },
      ],
    });

    if (!promo) {
      return sendError(res, "Invalid promo code.", 404);
    }

    if (!promo.isValid) {
      let reason = "This promo code is no longer valid.";
      if (!promo.isActive) reason = "This promo code has been deactivated.";
      else if (promo.expiresAt && promo.expiresAt < new Date()) reason = "This promo code has expired.";
      else if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) reason = "This promo code has reached its usage limit.";
      return sendError(res, reason, 410);
    }

    const discountAmount = promo.calculateDiscount(Number(subtotal));

    return sendSuccess(res, {
      valid: true,
      promoCodeId: promo._id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPromoCode,
  listPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
};
