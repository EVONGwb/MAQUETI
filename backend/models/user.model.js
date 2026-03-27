const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    googleSub: { type: String, default: null },
  },
  { versionKey: false }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
