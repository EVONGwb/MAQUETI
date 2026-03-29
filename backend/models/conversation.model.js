const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    productId: { type: Number, required: true, index: true },
    buyerId: { type: Number, required: true, index: true },
    sellerId: { type: Number, required: true, index: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Number, required: true, index: true },
    status: { type: String, default: "open", index: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
  },
  { versionKey: false }
);

conversationSchema.index({ productId: 1, buyerId: 1, sellerId: 1 }, { unique: true });

module.exports = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
