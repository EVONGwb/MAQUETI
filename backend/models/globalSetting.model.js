const mongoose = require("mongoose");

const globalSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Number, required: true, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.GlobalSetting || mongoose.model("GlobalSetting", globalSettingSchema);
