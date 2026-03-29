const User = require("../models/user.model");
const Product = require("../models/product.model");
const Store = require("../models/store.model");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const AuditLog = require("../models/auditLog.model");
const GlobalSetting = require("../models/globalSetting.model");
const AdCampaign = require("../models/adCampaign.model");

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const normalizeInt = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const normalizeString = (v) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

const allowedSubscriptionStatuses = new Set(["none", "active", "canceled"]);
const normalizeSubscriptionStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedSubscriptionStatuses.has(s) ? s : null;
};

const allowedUserStatuses = new Set(["active", "blocked", "disabled"]);
const normalizeUserStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedUserStatuses.has(s) ? s : null;
};

const allowedProductStatuses = new Set(["draft", "published", "hidden", "sold_out", "archived"]);
const normalizeProductStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedProductStatuses.has(s) ? s : null;
};

const allowedStoreStatuses = new Set(["active", "paused", "blocked"]);
const normalizeStoreStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedStoreStatuses.has(s) ? s : null;
};

const allowedChatStatuses = new Set(["open", "archived", "closed"]);
const normalizeChatStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedChatStatuses.has(s) ? s : null;
};

const writeAudit = async ({ req, action, entityType, entityId, before, after }) => {
  try {
    const actorUserId = Number(req.user?.id);
    if (!actorUserId) return;
    await AuditLog.create({
      id: generateNumericId(),
      actorUserId,
      actorEmail: req.user?.email ? String(req.user.email) : null,
      actorIsAdmin: true,
      action: String(action),
      entityType: String(entityType),
      entityId: entityId === undefined || entityId === null ? null : String(entityId),
      before: before ?? null,
      after: after ?? null,
      ip: req.ip ? String(req.ip) : null,
      userAgent: req.headers?.["user-agent"] ? String(req.headers["user-agent"]) : null,
      createdAt: Date.now(),
    });
  } catch {
    undefined;
  }
};

const updateUserStoreAccess = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: "User id inválido" });

    const { storePaymentsUnlocked, storeSubscriptionStatus, storePlan, storeSubscriptionEndsAt } = req.body || {};
    const status = storeSubscriptionStatus !== undefined ? normalizeSubscriptionStatus(storeSubscriptionStatus) : undefined;
    if (storeSubscriptionStatus !== undefined && status === null) return res.status(400).json({ message: "Estado de suscripción inválido" });

    const before = await User.findOne({ id: userId }, { _id: 0 }).lean();

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
      isAdmin: 1,
      status: 1,
      storePaymentsUnlocked: 1,
      storeSubscriptionStatus: 1,
      storePlan: 1,
      storeSubscriptionEndsAt: 1,
    });

    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

    await writeAudit({
      req,
      action: "USER_STORE_ACCESS_UPDATE",
      entityType: "user",
      entityId: updated.id,
      before,
      after: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isAdmin: Boolean(updated.isAdmin),
        status: updated.status || "active",
        storePaymentsUnlocked: Boolean(updated.storePaymentsUnlocked),
        storeSubscriptionStatus: updated.storeSubscriptionStatus || "none",
        storePlan: updated.storePlan || null,
        storeSubscriptionEndsAt: updated.storeSubscriptionEndsAt || null,
      },
    });

    return res.json({
      message: "Acceso tienda actualizado",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isAdmin: Boolean(updated.isAdmin),
        status: updated.status || "active",
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

const listAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, normalizeInt(req.query.limit, 50)));
    const q = normalizeString(req.query.q);
    const isAdmin = req.query.isAdmin !== undefined ? String(req.query.isAdmin) === "true" : undefined;
    const status = req.query.status !== undefined ? normalizeUserStatus(req.query.status) : undefined;
    if (req.query.status !== undefined && status === null) return res.status(400).json({ message: "Estado de usuario inválido" });

    const query = {};
    if (q) query.$or = [{ email: new RegExp(q, "i") }, { name: new RegExp(q, "i") }];
    if (isAdmin !== undefined) query.isAdmin = isAdmin;
    if (status !== undefined) query.status = status;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query, { _id: 0, password: 0, googleSub: 0 })
        .sort({ id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, users });
  } catch {
    return res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: "User id inválido" });

    const before = await User.findOne({ id: userId }, { _id: 0, password: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Usuario no encontrado" });

    const { isAdmin, status, name } = req.body || {};
    const nextStatus = status !== undefined ? normalizeUserStatus(status) : undefined;
    if (status !== undefined && nextStatus === null) return res.status(400).json({ message: "Estado de usuario inválido" });

    const $set = {};
    if (isAdmin !== undefined) $set.isAdmin = Boolean(isAdmin);
    if (nextStatus !== undefined) $set.status = nextStatus;
    if (name !== undefined) $set.name = String(name || "").trim();

    if (!Object.keys($set).length) return res.status(400).json({ message: "Nada que actualizar" });

    const updated = await User.findOneAndUpdate({ id: userId }, { $set }, { new: true }).select({
      _id: 0,
      id: 1,
      email: 1,
      name: 1,
      isAdmin: 1,
      status: 1,
      storePaymentsUnlocked: 1,
      storeSubscriptionStatus: 1,
      storePlan: 1,
      storeSubscriptionEndsAt: 1,
    });

    await writeAudit({ req, action: "USER_UPDATE", entityType: "user", entityId: userId, before, after: updated });

    return res.json({ message: "Usuario actualizado", user: updated });
  } catch {
    return res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

const listAdminProducts = async (req, res) => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, normalizeInt(req.query.limit, 50)));
    const q = normalizeString(req.query.q);
    const status = req.query.status !== undefined ? normalizeProductStatus(req.query.status) : undefined;
    if (req.query.status !== undefined && status === null) return res.status(400).json({ message: "Estado de producto inválido" });
    const userId = req.query.userId !== undefined ? Number(req.query.userId) : undefined;

    const query = {};
    if (q) query.$or = [{ title: new RegExp(q, "i") }, { category: new RegExp(q, "i") }, { sku: new RegExp(q, "i") }];
    if (status !== undefined) query.status = status;
    if (userId !== undefined && Number.isFinite(userId)) query.userId = userId;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query, { _id: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, products });
  } catch {
    return res.status(500).json({ message: "Error al obtener productos" });
  }
};

const updateAdminProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!productId) return res.status(400).json({ message: "Product id inválido" });

    const before = await Product.findOne({ id: productId }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Producto no encontrado" });

    const { status, title, price, stock, category, subcategory, description, condition, location, imageUrl } = req.body || {};
    const nextStatus = status !== undefined ? normalizeProductStatus(status) : undefined;
    if (status !== undefined && nextStatus === null) return res.status(400).json({ message: "Estado de producto inválido" });

    const $set = {};
    if (nextStatus !== undefined) $set.status = nextStatus;
    if (title !== undefined) $set.title = String(title || "").trim();
    if (price !== undefined) $set.price = Number(price);
    if (stock !== undefined) $set.stock = stock === null ? null : Number(stock);
    if (category !== undefined) $set.category = String(category || "").trim() || "Otros";
    if (subcategory !== undefined) $set.subcategory = subcategory ? String(subcategory) : null;
    if (description !== undefined) $set.description = description ? String(description) : null;
    if (condition !== undefined) $set.condition = condition ? String(condition) : "Como nuevo";
    if (location !== undefined) $set.location = location ? String(location) : null;
    if (imageUrl !== undefined) $set.imageUrl = imageUrl ? String(imageUrl) : null;

    if (!Object.keys($set).length) return res.status(400).json({ message: "Nada que actualizar" });
    if ($set.price !== undefined && (!Number.isFinite($set.price) || $set.price < 0)) return res.status(400).json({ message: "Precio inválido" });
    if ($set.stock !== undefined && $set.stock !== null && (!Number.isFinite($set.stock) || $set.stock < 0)) return res.status(400).json({ message: "Stock inválido" });

    const updated = await Product.findOneAndUpdate({ id: productId }, { $set }, { new: true }).select({ _id: 0 });
    await writeAudit({ req, action: "PRODUCT_UPDATE", entityType: "product", entityId: productId, before, after: updated });
    return res.json({ message: "Producto actualizado", product: updated });
  } catch {
    return res.status(500).json({ message: "Error al actualizar producto" });
  }
};

const deleteAdminProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!productId) return res.status(400).json({ message: "Product id inválido" });

    const before = await Product.findOne({ id: productId }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Producto no encontrado" });

    await Product.deleteOne({ id: productId });
    await writeAudit({ req, action: "PRODUCT_DELETE", entityType: "product", entityId: productId, before, after: null });
    return res.json({ message: "Producto eliminado" });
  } catch {
    return res.status(500).json({ message: "Error al eliminar producto" });
  }
};

const listAdminStores = async (req, res) => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, normalizeInt(req.query.limit, 50)));
    const q = normalizeString(req.query.q);
    const status = req.query.status !== undefined ? normalizeStoreStatus(req.query.status) : undefined;
    if (req.query.status !== undefined && status === null) return res.status(400).json({ message: "Estado de tienda inválido" });

    const query = {};
    if (q) query.$or = [{ name: new RegExp(q, "i") }, { slug: new RegExp(q, "i") }];
    if (status !== undefined) query.status = status;

    const [total, stores] = await Promise.all([
      Store.countDocuments(query),
      Store.find(query, { _id: 0 })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, stores });
  } catch {
    return res.status(500).json({ message: "Error al obtener tiendas" });
  }
};

const updateAdminStore = async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    if (!storeId) return res.status(400).json({ message: "Store id inválido" });

    const before = await Store.findOne({ id: storeId }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Tienda no encontrada" });

    const { status, name, description, logoUrl, bannerUrl, themePrimary, themeAccent, themeBackground } = req.body || {};
    const nextStatus = status !== undefined ? normalizeStoreStatus(status) : undefined;
    if (status !== undefined && nextStatus === null) return res.status(400).json({ message: "Estado de tienda inválido" });

    const $set = {};
    if (nextStatus !== undefined) $set.status = nextStatus;
    if (name !== undefined) $set.name = String(name || "").trim();
    if (description !== undefined) $set.description = String(description || "");
    if (logoUrl !== undefined) $set.logoUrl = String(logoUrl || "");
    if (bannerUrl !== undefined) $set.bannerUrl = String(bannerUrl || "");
    if (themePrimary !== undefined) $set.themePrimary = String(themePrimary || "#2563eb");
    if (themeAccent !== undefined) $set.themeAccent = String(themeAccent || "#0f172a");
    if (themeBackground !== undefined) $set.themeBackground = String(themeBackground || "#ffffff");
    $set.updatedAt = Date.now();

    const updated = await Store.findOneAndUpdate({ id: storeId }, { $set }, { new: true }).select({ _id: 0 });
    await writeAudit({ req, action: "STORE_UPDATE", entityType: "store", entityId: storeId, before, after: updated });
    return res.json({ message: "Tienda actualizada", store: updated });
  } catch {
    return res.status(500).json({ message: "Error al actualizar tienda" });
  }
};

const listAdminChats = async (req, res) => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, normalizeInt(req.query.limit, 50)));
    const status = req.query.status !== undefined ? normalizeChatStatus(req.query.status) : undefined;
    if (req.query.status !== undefined && status === null) return res.status(400).json({ message: "Estado de chat inválido" });

    const query = {};
    if (status !== undefined) query.status = status;
    if (req.query.productId) query.productId = Number(req.query.productId);
    if (req.query.buyerId) query.buyerId = Number(req.query.buyerId);
    if (req.query.sellerId) query.sellerId = Number(req.query.sellerId);

    const [total, chats] = await Promise.all([
      Conversation.countDocuments(query),
      Conversation.find(query, { _id: 0 })
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, chats });
  } catch {
    return res.status(500).json({ message: "Error al obtener chats" });
  }
};

const getAdminChatMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    if (!conversationId) return res.status(400).json({ message: "Conversation id inválido" });
    const messages = await Message.find({ conversationId }, { _id: 0 }).sort({ createdAt: 1 }).lean();
    return res.json({ total: messages.length, messages });
  } catch {
    return res.status(500).json({ message: "Error al obtener mensajes" });
  }
};

const updateAdminChat = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    if (!conversationId) return res.status(400).json({ message: "Conversation id inválido" });

    const before = await Conversation.findOne({ id: conversationId }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Chat no encontrado" });

    const { status } = req.body || {};
    const nextStatus = status !== undefined ? normalizeChatStatus(status) : undefined;
    if (status !== undefined && nextStatus === null) return res.status(400).json({ message: "Estado de chat inválido" });
    if (nextStatus === undefined) return res.status(400).json({ message: "Nada que actualizar" });

    const updatedAt = Date.now();
    const updated = await Conversation.findOneAndUpdate({ id: conversationId }, { $set: { status: nextStatus, updatedAt } }, { new: true }).select({ _id: 0 });
    await writeAudit({ req, action: "CHAT_UPDATE", entityType: "chat", entityId: conversationId, before, after: updated });
    return res.json({ message: "Chat actualizado", chat: updated });
  } catch {
    return res.status(500).json({ message: "Error al actualizar chat" });
  }
};

const getAdminSettings = async (req, res) => {
  try {
    const settings = await GlobalSetting.find({}, { _id: 0 }).sort({ key: 1 }).lean();
    return res.json({ total: settings.length, settings });
  } catch {
    return res.status(500).json({ message: "Error al obtener settings" });
  }
};

const patchAdminSettings = async (req, res) => {
  try {
    const now = Date.now();
    const items = Array.isArray(req.body?.items) ? req.body.items : req.body?.key ? [{ key: req.body.key, value: req.body.value }] : [];
    if (!items.length) return res.status(400).json({ message: "Nada que actualizar" });

    const results = [];
    for (const item of items) {
      const key = normalizeString(item?.key);
      if (!key) return res.status(400).json({ message: "Key inválida" });
      const before = await GlobalSetting.findOne({ key }, { _id: 0 }).lean();
      const updated = await GlobalSetting.findOneAndUpdate({ key }, { $set: { value: item?.value, updatedAt: now } }, { upsert: true, new: true }).select({ _id: 0 });
      await writeAudit({ req, action: "SETTINGS_UPDATE", entityType: "setting", entityId: key, before, after: updated });
      results.push(updated);
    }

    return res.json({ message: "Settings actualizados", settings: results });
  } catch {
    return res.status(500).json({ message: "Error al actualizar settings" });
  }
};

const listAdminAds = async (req, res) => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, normalizeInt(req.query.limit, 50)));
    const status = req.query.status ? String(req.query.status) : null;
    const query = {};
    if (status) query.status = status;

    const [total, ads] = await Promise.all([
      AdCampaign.countDocuments(query),
      AdCampaign.find(query, { _id: 0 })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, ads });
  } catch {
    return res.status(500).json({ message: "Error al obtener publicidad" });
  }
};

const createAdminAd = async (req, res) => {
  try {
    const name = normalizeString(req.body?.name);
    if (!name) return res.status(400).json({ message: "Nombre requerido" });
    const now = Date.now();
    const ad = await AdCampaign.create({
      id: generateNumericId(),
      name,
      status: String(req.body?.status || "draft"),
      placement: String(req.body?.placement || "home"),
      startsAt: req.body?.startsAt ? Number(req.body.startsAt) : null,
      endsAt: req.body?.endsAt ? Number(req.body.endsAt) : null,
      targeting: req.body?.targeting ?? null,
      creative: req.body?.creative ?? null,
      createdAt: now,
      updatedAt: now,
    });
    const payload = await AdCampaign.findOne({ id: ad.id }, { _id: 0 }).lean();
    await writeAudit({ req, action: "AD_CREATE", entityType: "ad", entityId: ad.id, before: null, after: payload });
    return res.status(201).json({ message: "Publicidad creada", ad: payload });
  } catch {
    return res.status(500).json({ message: "Error al crear publicidad" });
  }
};

const updateAdminAd = async (req, res) => {
  try {
    const adId = Number(req.params.id);
    if (!adId) return res.status(400).json({ message: "Ad id inválido" });
    const before = await AdCampaign.findOne({ id: adId }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Publicidad no encontrada" });

    const $set = {};
    for (const k of ["name", "status", "placement"]) {
      if (req.body?.[k] !== undefined) $set[k] = String(req.body[k]);
    }
    if (req.body?.startsAt !== undefined) $set.startsAt = req.body.startsAt ? Number(req.body.startsAt) : null;
    if (req.body?.endsAt !== undefined) $set.endsAt = req.body.endsAt ? Number(req.body.endsAt) : null;
    if (req.body?.targeting !== undefined) $set.targeting = req.body.targeting ?? null;
    if (req.body?.creative !== undefined) $set.creative = req.body.creative ?? null;
    $set.updatedAt = Date.now();

    if (!Object.keys($set).length) return res.status(400).json({ message: "Nada que actualizar" });

    const updated = await AdCampaign.findOneAndUpdate({ id: adId }, { $set }, { new: true }).select({ _id: 0 });
    await writeAudit({ req, action: "AD_UPDATE", entityType: "ad", entityId: adId, before, after: updated });
    return res.json({ message: "Publicidad actualizada", ad: updated });
  } catch {
    return res.status(500).json({ message: "Error al actualizar publicidad" });
  }
};

const deleteAdminAd = async (req, res) => {
  try {
    const adId = Number(req.params.id);
    if (!adId) return res.status(400).json({ message: "Ad id inválido" });
    const before = await AdCampaign.findOne({ id: adId }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Publicidad no encontrada" });
    await AdCampaign.deleteOne({ id: adId });
    await writeAudit({ req, action: "AD_DELETE", entityType: "ad", entityId: adId, before, after: null });
    return res.json({ message: "Publicidad eliminada" });
  } catch {
    return res.status(500).json({ message: "Error al eliminar publicidad" });
  }
};

const listAdminAudit = async (req, res) => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, normalizeInt(req.query.limit, 50)));
    const actorUserId = req.query.actorUserId ? Number(req.query.actorUserId) : null;
    const action = req.query.action ? String(req.query.action) : null;
    const entityType = req.query.entityType ? String(req.query.entityType) : null;
    const from = req.query.from ? Number(req.query.from) : null;
    const to = req.query.to ? Number(req.query.to) : null;

    const query = {};
    if (actorUserId) query.actorUserId = actorUserId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (from || to) query.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };

    const [total, events] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query, { _id: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, events });
  } catch {
    return res.status(500).json({ message: "Error al obtener auditoría" });
  }
};

module.exports = {
  updateUserStoreAccess,
  listAdminUsers,
  updateAdminUser,
  listAdminProducts,
  updateAdminProduct,
  deleteAdminProduct,
  listAdminStores,
  updateAdminStore,
  listAdminChats,
  getAdminChatMessages,
  updateAdminChat,
  getAdminSettings,
  patchAdminSettings,
  listAdminAds,
  createAdminAd,
  updateAdminAd,
  deleteAdminAd,
  listAdminAudit,
};
