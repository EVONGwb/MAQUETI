const mongoose = require("mongoose");

const adCampaignSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    status: { type: String, default: "draft", index: true },
    placement: { type: String, default: "home" },
    startsAt: { type: Number, default: null, index: true },
    endsAt: { type: Number, default: null, index: true },
    targeting: { type: mongoose.Schema.Types.Mixed, default: null },
    creative: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Number, required: true, index: true },
    updatedAt: { type: Number, required: true, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.AdCampaign || mongoose.model("AdCampaign", adCampaignSchema);
