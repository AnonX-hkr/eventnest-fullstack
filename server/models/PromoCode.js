const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Promo code is required"],
      uppercase: true,
      trim: true,
      unique: true,
      minlength: [3, "Code must be at least 3 characters"],
      maxlength: [20, "Code cannot exceed 20 characters"],
      match: [/^[A-Z0-9_-]+$/, "Code can only contain letters, numbers, dashes, and underscores"],
    },

    // null = applies to all events by this organizer
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    discountType: {
      type: String,
      enum: { values: ["percent", "fixed"], message: "discountType must be percent or fixed" },
      required: true,
    },

    // percent: 1–100  |  fixed: dollar amount
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value must be positive"],
    },

    // null = unlimited
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ organizer: 1 });
promoCodeSchema.index({ event: 1 });

// Virtual: is this code still usable?
promoCodeSchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
});

/**
 * Calculate discount amount for a given subtotal.
 * Returns a number rounded to 2 decimal places.
 */
promoCodeSchema.methods.calculateDiscount = function (subtotal) {
  if (this.discountType === "percent") {
    const pct = Math.min(this.discountValue, 100);
    return Math.round(subtotal * (pct / 100) * 100) / 100;
  }
  // fixed — cap at subtotal so total never goes negative
  return Math.min(this.discountValue, subtotal);
};

module.exports = mongoose.model("PromoCode", promoCodeSchema);
