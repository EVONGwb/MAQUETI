const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    ownerId: { type: Number, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    welcomeMessage: { type: String, default: "" },
    announcement: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    themePrimary: { type: String, default: "#2563eb" },
    themeAccent: { type: String, default: "#0f172a" },
    themeBackground: { type: String, default: "#ffffff" },
    layoutStyle: { type: String, default: "boutique" },
    instagramUrl: { type: String, default: "" },
    whatsappUrl: { type: String, default: "" },
    status: { type: String, default: "active", index: true },
    createdAt: { type: Number, required: true, index: true },
    updatedAt: { type: Number, required: true, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.Store || mongoose.model("Store", storeSchema);
