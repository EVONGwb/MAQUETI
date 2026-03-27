const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    conversationId: { type: Number, required: true, index: true },
    senderId: { type: Number, required: true, index: true },
    text: { type: String, default: "" },
    images: { type: [String], default: [] },
    readBy: { type: [Number], default: [] },
    createdAt: { type: Number, required: true, index: true },
    updatedAt: { type: Number, required: true },
  },
  { versionKey: false }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
