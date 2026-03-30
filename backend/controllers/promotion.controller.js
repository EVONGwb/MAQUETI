const Product = require("../models/product.model");
const ProductPromotion = require("../models/productPromotion.model");
const GlobalSetting = require("../models/globalSetting.model");
const AuditLog = require("../models/auditLog.model");

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const allowedPromotionTypes = new Set(["home", "category", "search", "boost"]);
const normalizePromotionType = (value) => {
  const s = String(value || "").trim().toLowerCase();
  return allowedPromotionTypes.has(s) ? s : null;
};

const toPositiveInt = (v, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const x = Math.floor(n);
  return x > 0 ? x : fallback;
};

const getPricing = async () => {
  const row = await GlobalSetting.findOne({ key: "promotion_pricing" }, { _id: 0 }).lean();
  const value = row?.value && typeof row.value === "object" ? row.value : null;
  const defaults = {
    home: { priceCents: 499, durationHours: 24, currency: "eur" },
    category: { priceCents: 399, durationHours: 24, currency: "eur" },
    search: { priceCents: 299, durationHours: 24, currency: "eur" },
    boost: { priceCents: 899, durationHours: 168, currency: "eur" },
  };
  return { ...defaults, ...(value || {}) };
};

const getLimits = async () => {
  const row = await GlobalSetting.findOne({ key: "promotion_limits" }, { _id: 0 }).lean();
  const value = row?.value && typeof row.value === "object" ? row.value : null;
  const defaults = { home: 3, category: 3, search: 3 };
  return { ...defaults, ...(value || {}) };
};

const writeAudit = async ({ req, action, entityType, entityId, before, after }) => {
  try {
    const actorUserId = Number(req.user?.id);
    if (!actorUserId) return;
    await AuditLog.create({
      id: generateNumericId(),
      actorUserId,
      actorEmail: req.user?.email ? String(req.user.email) : null,
      actorIsAdmin: Boolean(req.user?.isAdmin),
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

const listFeaturedProducts = async (req, res) => {
  try {
    const promotionType = normalizePromotionType(req.query.placement || req.query.promotionType);
    if (!promotionType) return res.status(400).json({ message: "placement inválido" });

    const category = promotionType === "category" ? String(req.query.category || "").trim() || null : null;
    const limit = Math.min(6, Math.max(1, toPositiveInt(req.query.limit, 3)));
    const now = Date.now();

    const limits = await getLimits();
    const hardLimit = Math.min(limit, Math.max(1, Number(limits[promotionType] || limit)));

    const query = {
      status: "active",
      startsAt: { $lte: now },
      endsAt: { $gt: now },
      promotionType,
    };
    if (category) query.category = category;

    const promos = await ProductPromotion.find(query, { _id: 0 })
      .sort({ endsAt: -1, createdAt: -1 })
      .limit(hardLimit)
      .lean();

    const ids = promos.map((p) => p.productId);
    if (!ids.length) return res.json({ total: 0, products: [] });

    const products = await Product.find({ id: { $in: ids }, status: "published" }, { _id: 0 }).lean();
    const map = new Map(products.map((p) => [String(p.id), p]));
    const ordered = ids.map((id) => map.get(String(id))).filter(Boolean);
    return res.json({ total: ordered.length, products: ordered });
  } catch {
    return res.status(500).json({ message: "Error obteniendo destacados" });
  }
};

const listMyPromotions = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ message: "Token requerido" });
    const promotions = await ProductPromotion.find({ userId }, { _id: 0 }).sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ total: promotions.length, promotions });
  } catch {
    return res.status(500).json({ message: "Error obteniendo promociones" });
  }
};

const requestPromotion = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ message: "Token requerido" });

    const productId = Number(req.body?.productId);
    if (!productId) return res.status(400).json({ message: "productId requerido" });

    const promotionType = normalizePromotionType(req.body?.promotionType);
    if (!promotionType) return res.status(400).json({ message: "promotionType inválido" });

    const category = promotionType === "category" ? String(req.body?.category || "").trim() || null : null;
    if (promotionType === "category" && !category) return res.status(400).json({ message: "category requerida para category" });

    const pricing = await getPricing();
    const plan = pricing[promotionType] || null;
    if (!plan?.priceCents || !plan?.durationHours) return res.status(500).json({ message: "Pricing no configurado" });

    const durationHours = toPositiveInt(req.body?.durationHours, Number(plan.durationHours));
    const priceCents = Number(plan.priceCents);
    const currency = String(plan.currency || "eur");

    const product = await Product.findOne({ id: productId }, { _id: 0 }).lean();
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    if (String(product.userId) !== String(userId)) return res.status(403).json({ message: "No autorizado" });

    const now = Date.now();
    const id = generateNumericId();
    const promo = await ProductPromotion.create({
      id,
      productId,
      userId,
      promotionType,
      category,
      query: null,
      durationHours,
      priceCents,
      currency,
      status: "pending_review",
      paymentStatus: "pending",
      startsAt: null,
      endsAt: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });

    await writeAudit({ req, action: "PROMOTION_REQUEST", entityType: "promotion", entityId: id, before: null, after: promo.toObject ? promo.toObject() : promo });

    return res.status(201).json({
      message: "Solicitud de promoción creada (pendiente de aprobación)",
      promotion: {
        id,
        productId,
        userId,
        promotionType,
        category,
        durationHours,
        priceCents,
        currency,
        status: "pending_review",
        paymentStatus: "pending",
        startsAt: null,
        endsAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch {
    return res.status(500).json({ message: "Error solicitando promoción" });
  }
};

const listAdminPromotions = async (req, res) => {
  try {
    const page = Math.max(1, toPositiveInt(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, toPositiveInt(req.query.limit, 50)));
    const status = req.query.status ? String(req.query.status) : null;
    const promotionType = req.query.promotionType ? normalizePromotionType(req.query.promotionType) : null;
    if (req.query.promotionType && !promotionType) return res.status(400).json({ message: "promotionType inválido" });

    const query = {};
    if (status) query.status = status;
    if (promotionType) query.promotionType = promotionType;

    const [total, promotions] = await Promise.all([
      ProductPromotion.countDocuments(query),
      ProductPromotion.find(query, { _id: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ total, page, limit, promotions });
  } catch {
    return res.status(500).json({ message: "Error obteniendo promociones" });
  }
};

const patchAdminPromotion = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const before = await ProductPromotion.findOne({ id }, { _id: 0 }).lean();
    if (!before) return res.status(404).json({ message: "Promoción no encontrada" });

    const action = String(req.body?.action || "").trim().toLowerCase();
    if (!action) return res.status(400).json({ message: "action requerida" });

    const now = Date.now();
    if (action === "approve") {
      const startsAt = now;
      const endsAt = now + Number(before.durationHours) * 3600 * 1000;
      const updated = await ProductPromotion.findOneAndUpdate(
        { id },
        { $set: { status: "active", paymentStatus: "paid", startsAt, endsAt, updatedAt: now, notes: String(req.body?.notes || "") || null } },
        { new: true }
      )
        .select({ _id: 0 })
        .lean();

      await Product.updateOne(
        { id: Number(before.productId) },
        {
          $set: {
            isPromoted: true,
            promotionType: before.promotionType,
            promotionStart: startsAt,
            promotionEnd: endsAt,
            paymentStatus: "paid",
          },
        }
      );

      await writeAudit({ req, action: "PROMOTION_APPROVE", entityType: "promotion", entityId: id, before, after: updated });
      return res.json({ message: "Promoción aprobada", promotion: updated });
    }

    if (action === "reject") {
      const updated = await ProductPromotion.findOneAndUpdate(
        { id },
        { $set: { status: "rejected", paymentStatus: before.paymentStatus || "pending", updatedAt: now, notes: String(req.body?.notes || "") || null } },
        { new: true }
      )
        .select({ _id: 0 })
        .lean();
      await writeAudit({ req, action: "PROMOTION_REJECT", entityType: "promotion", entityId: id, before, after: updated });
      return res.json({ message: "Promoción rechazada", promotion: updated });
    }

    if (action === "pause") {
      const updated = await ProductPromotion.findOneAndUpdate(
        { id },
        { $set: { status: "paused", updatedAt: now, notes: String(req.body?.notes || "") || null } },
        { new: true }
      )
        .select({ _id: 0 })
        .lean();
      await Product.updateOne({ id: Number(before.productId) }, { $set: { isPromoted: false, promotionType: null, promotionStart: null, promotionEnd: null } });
      await writeAudit({ req, action: "PROMOTION_PAUSE", entityType: "promotion", entityId: id, before, after: updated });
      return res.json({ message: "Promoción pausada", promotion: updated });
    }

    if (action === "cancel") {
      const updated = await ProductPromotion.findOneAndUpdate(
        { id },
        { $set: { status: "canceled", updatedAt: now, notes: String(req.body?.notes || "") || null } },
        { new: true }
      )
        .select({ _id: 0 })
        .lean();
      await Product.updateOne({ id: Number(before.productId) }, { $set: { isPromoted: false, promotionType: null, promotionStart: null, promotionEnd: null } });
      await writeAudit({ req, action: "PROMOTION_CANCEL", entityType: "promotion", entityId: id, before, after: updated });
      return res.json({ message: "Promoción cancelada", promotion: updated });
    }

    return res.status(400).json({ message: "action inválida" });
  } catch {
    return res.status(500).json({ message: "Error actualizando promoción" });
  }
};

const getAdminPromotionPricing = async (req, res) => {
  try {
    const pricing = await getPricing();
    const limits = await getLimits();
    return res.json({ pricing, limits });
  } catch {
    return res.status(500).json({ message: "Error obteniendo pricing" });
  }
};

const patchAdminPromotionPricing = async (req, res) => {
  try {
    const now = Date.now();
    const pricing = req.body?.pricing && typeof req.body.pricing === "object" ? req.body.pricing : null;
    const limits = req.body?.limits && typeof req.body.limits === "object" ? req.body.limits : null;
    if (!pricing && !limits) return res.status(400).json({ message: "Nada que actualizar" });

    const out = {};
    if (pricing) {
      const before = await GlobalSetting.findOne({ key: "promotion_pricing" }, { _id: 0 }).lean();
      const updated = await GlobalSetting.findOneAndUpdate({ key: "promotion_pricing" }, { $set: { value: pricing, updatedAt: now } }, { upsert: true, new: true })
        .select({ _id: 0 })
        .lean();
      await writeAudit({ req, action: "PROMOTION_PRICING_UPDATE", entityType: "setting", entityId: "promotion_pricing", before, after: updated });
      out.pricing = updated?.value || pricing;
    }
    if (limits) {
      const before = await GlobalSetting.findOne({ key: "promotion_limits" }, { _id: 0 }).lean();
      const updated = await GlobalSetting.findOneAndUpdate({ key: "promotion_limits" }, { $set: { value: limits, updatedAt: now } }, { upsert: true, new: true })
        .select({ _id: 0 })
        .lean();
      await writeAudit({ req, action: "PROMOTION_LIMITS_UPDATE", entityType: "setting", entityId: "promotion_limits", before, after: updated });
      out.limits = updated?.value || limits;
    }
    return res.json({ message: "Configuración actualizada", ...out });
  } catch {
    return res.status(500).json({ message: "Error actualizando configuración" });
  }
};

module.exports = {
  listFeaturedProducts,
  getAdminPromotionPricing,
  patchAdminPromotionPricing,
  getPromotionConfig: getAdminPromotionPricing,
  listMyPromotions,
  requestPromotion,
  listAdminPromotions,
  patchAdminPromotion,
};
