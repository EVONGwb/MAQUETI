const mongoose = require("mongoose");

const productPromotionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    productId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    promotionType: { type: String, required: true, index: true },
    category: { type: String, default: null, index: true },
    query: { type: String, default: null },
    durationHours: { type: Number, required: true },
    priceCents: { type: Number, required: true },
    currency: { type: String, default: "eur" },
    status: { type: String, default: "pending_review", index: true },
    paymentStatus: { type: String, default: "pending", index: true },
    startsAt: { type: Number, default: null, index: true },
    endsAt: { type: Number, default: null, index: true },
    notes: { type: String, default: null },
    createdAt: { type: Number, required: true, index: true },
    updatedAt: { type: Number, required: true, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.ProductPromotion || mongoose.model("ProductPromotion", productPromotionSchema);
