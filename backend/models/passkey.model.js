const mongoose = require("mongoose");

const passkeySchema = new mongoose.Schema(
  {
    credentialId: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true },
    transports: { type: String, default: null },
  },
  { versionKey: false }
);

module.exports = mongoose.models.Passkey || mongoose.model("Passkey", passkeySchema);
