const User = require("../models/user.model");

const allowedStatuses = new Set(["none", "active", "canceled"]);

const normalizeStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedStatuses.has(s) ? s : null;
};

const updateUserStoreAccess = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: "User id inválido" });

    const { storePaymentsUnlocked, storeSubscriptionStatus, storePlan, storeSubscriptionEndsAt } = req.body || {};
    const status = storeSubscriptionStatus !== undefined ? normalizeStatus(storeSubscriptionStatus) : undefined;
    if (storeSubscriptionStatus !== undefined && status === null) return res.status(400).json({ message: "Estado de suscripción inválido" });

    const $set = {};
    if (storePaymentsUnlocked !== undefined) $set.storePaymentsUnlocked = Boolean(storePaymentsUnlocked);
    if (status !== undefined) $set.storeSubscriptionStatus = status;
    if (storePlan !== undefined) $set.storePlan = storePlan ? String(storePlan) : null;
    if (storeSubscriptionEndsAt !== undefined) $set.storeSubscriptionEndsAt = storeSubscriptionEndsAt ? Number(storeSubscriptionEndsAt) : null;

    if (!Object.keys($set).length) return res.status(400).json({ message: "Nada que actualizar" });

    const updated = await User.findOneAndUpdate({ id: userId }, { $set }, { new: true }).select({
      id: 1,
      email: 1,
      name: 1,
      storePaymentsUnlocked: 1,
      storeSubscriptionStatus: 1,
      storePlan: 1,
      storeSubscriptionEndsAt: 1,
    });

    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({
      message: "Acceso tienda actualizado",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        storePaymentsUnlocked: Boolean(updated.storePaymentsUnlocked),
        storeSubscriptionStatus: updated.storeSubscriptionStatus || "none",
        storePlan: updated.storePlan || null,
        storeSubscriptionEndsAt: updated.storeSubscriptionEndsAt || null,
      },
    });
  } catch {
    return res.status(500).json({ message: "Error al actualizar acceso tienda" });
  }
};

module.exports = {
  updateUserStoreAccess,
};

