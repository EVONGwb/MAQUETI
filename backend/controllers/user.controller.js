const User = require("../models/user.model");

const pickUserPublic = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: Boolean(u.isAdmin),
    status: u.status || "active",
    storeSubscriptionStatus: u.storeSubscriptionStatus || "none",
    storePlan: u.storePlan || null,
    storeSubscriptionEndsAt: u.storeSubscriptionEndsAt || null,
    storePaymentsUnlocked: Boolean(u.storePaymentsUnlocked),
    avatarUrl: u.avatarUrl || null,
    bannerUrl: u.bannerUrl || null,
    themeColor: u.themeColor || null,
  };
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { id: 1, name: 1, email: 1, _id: 0 }).sort({ id: 1 }).lean();
    res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener usuarios",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token inválido" });
    const u = await User.findOne({ id: Number(userId) }).select({ password: 0, googleSub: 0, _id: 0 }).lean();
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json({ user: pickUserPublic(u) });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener perfil" });
  }
};

const patchMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token inválido" });

    const name = req.body?.name !== undefined ? String(req.body.name || "").trim() : undefined;
    const avatarUrl = req.body?.avatarUrl !== undefined ? (req.body.avatarUrl ? String(req.body.avatarUrl).trim() : null) : undefined;
    const bannerUrl = req.body?.bannerUrl !== undefined ? (req.body.bannerUrl ? String(req.body.bannerUrl).trim() : null) : undefined;
    const themeColor = req.body?.themeColor !== undefined ? (req.body.themeColor ? String(req.body.themeColor).trim() : null) : undefined;

    if (name !== undefined && name.length < 2) return res.status(400).json({ message: "Nombre demasiado corto" });
    if (name !== undefined && name.length > 40) return res.status(400).json({ message: "Nombre demasiado largo" });

    const urlOk = (v) => v === null || v === undefined || (typeof v === "string" && v.length <= 600 && (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")));
    if (!urlOk(avatarUrl)) return res.status(400).json({ message: "URL de avatar inválida" });
    if (!urlOk(bannerUrl)) return res.status(400).json({ message: "URL de banner inválida" });

    if (themeColor !== undefined && themeColor !== null) {
      const ok = /^#[0-9a-fA-F]{6}$/.test(themeColor);
      if (!ok) return res.status(400).json({ message: "Color inválido" });
    }

    const $set = {};
    if (name !== undefined) $set.name = name;
    if (avatarUrl !== undefined) $set.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) $set.bannerUrl = bannerUrl;
    if (themeColor !== undefined) $set.themeColor = themeColor;

    const updated = await User.findOneAndUpdate(
      { id: Number(userId) },
      { $set },
      { new: true }
    ).select({ password: 0, googleSub: 0, _id: 0 });

    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json({ message: "Perfil actualizado", user: pickUserPublic(updated) });
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

module.exports = {
  getUsers,
  getMe,
  patchMe,
};
