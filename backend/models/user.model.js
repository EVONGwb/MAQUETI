const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    googleSub: { type: String, default: null },
    isAdmin: { type: Boolean, default: false, index: true },
    status: { type: String, default: "active", index: true },
    storeSubscriptionStatus: { type: String, default: "none", index: true },
    storePlan: { type: String, default: null },
    storeSubscriptionEndsAt: { type: Number, default: null },
    storePaymentsUnlocked: { type: Boolean, default: false, index: true },
    avatarUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    themeColor: { type: String, default: null },
  },
  { versionKey: false }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
