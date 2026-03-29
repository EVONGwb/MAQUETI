const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    actorUserId: { type: Number, required: true, index: true },
    actorEmail: { type: String, default: null },
    actorIsAdmin: { type: Boolean, default: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: null, index: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    createdAt: { type: Number, required: true, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
