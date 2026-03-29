const Store = require("../models/store.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const slugify = (input) => {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "tienda";
};

const ensureUniqueSlug = async (base, ownerId) => {
  const baseSlug = slugify(base);
  if (!baseSlug) return "tienda";
  const existing = await Store.findOne({ slug: baseSlug }, { ownerId: 1, _id: 0 }).lean();
  if (!existing) return baseSlug;
  if (String(existing.ownerId) === String(ownerId)) return baseSlug;
  for (let i = 2; i < 200; i++) {
    const candidate = `${baseSlug}-${i}`;
    const hit = await Store.findOne({ slug: candidate }, { ownerId: 1, _id: 0 }).lean();
    if (!hit) return candidate;
    if (String(hit.ownerId) === String(ownerId)) return candidate;
  }
  return `${baseSlug}-${generateNumericId()}`;
};

const requireStoreSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token requerido" });
    const user = await User.findOne(
      { id: Number(userId) },
      { storeSubscriptionStatus: 1, storePlan: 1, storeSubscriptionEndsAt: 1, storePaymentsUnlocked: 1, _id: 0 }
    ).lean();
    if (!user) return res.status(401).json({ message: "Usuario no válido" });
    if (user.storeSubscriptionStatus !== "active") {
      if (!user.storePaymentsUnlocked) {
        return res.status(403).json({ message: "Activación de Tienda no disponible aún", code: "STORE_SUBSCRIPTION_LOCKED" });
      }
      return res.status(402).json({ message: "Suscripción requerida para activar Tienda", code: "STORE_SUBSCRIPTION_REQUIRED" });
    }
    return next();
  } catch {
    return res.status(500).json({ message: "Error validando suscripción" });
  }
};

const getMyStore = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: "Token requerido" });
    const store = await Store.findOne({ ownerId: Number(ownerId) }, { _id: 0 }).lean();
    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });
    return res.json({ store });
  } catch {
    return res.status(500).json({ message: "Error al obtener tienda" });
  }
};

const upsertMyStore = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: "Token requerido" });

    const { name, description, welcomeMessage, logoUrl, bannerUrl, themePrimary, themeAccent, themeBackground } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: "Nombre de tienda requerido" });

    const now = Date.now();
    const existing = await Store.findOne({ ownerId: Number(ownerId) }, { _id: 0 }).lean();
    const slug = await ensureUniqueSlug(name, ownerId);

    if (!existing) {
      const id = generateNumericId();
      await Store.create({
        id,
        ownerId: Number(ownerId),
        slug,
        name: String(name).trim(),
        description: String(description || ""),
        welcomeMessage: String(welcomeMessage || ""),
        logoUrl: String(logoUrl || ""),
        bannerUrl: String(bannerUrl || ""),
        themePrimary: String(themePrimary || "#2563eb"),
        themeAccent: String(themeAccent || "#0f172a"),
        themeBackground: String(themeBackground || "#ffffff"),
        createdAt: now,
        updatedAt: now,
      });
      const store = await Store.findOne({ ownerId: Number(ownerId) }, { _id: 0 }).lean();
      return res.status(201).json({ message: "Tienda creada", store });
    }

    await Store.updateOne(
      { ownerId: Number(ownerId) },
      {
        $set: {
          slug,
          name: String(name).trim(),
          description: String(description || ""),
          welcomeMessage: String(welcomeMessage || ""),
          logoUrl: String(logoUrl || ""),
          bannerUrl: String(bannerUrl || ""),
          themePrimary: String(themePrimary || "#2563eb"),
          themeAccent: String(themeAccent || "#0f172a"),
          themeBackground: String(themeBackground || "#ffffff"),
          updatedAt: now,
        },
      }
    );
    const store = await Store.findOne({ ownerId: Number(ownerId) }, { _id: 0 }).lean();
    return res.json({ message: "Tienda actualizada", store });
  } catch {
    return res.status(500).json({ message: "Error al guardar tienda" });
  }
};

const uploadMyStoreAsset = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: "Token requerido" });
    const kind = String(req.query.type || "logo").toLowerCase();
    if (kind !== "logo" && kind !== "banner") return res.status(400).json({ message: "Tipo inválido" });
    if (!req.file) return res.status(400).json({ message: "Archivo requerido" });
    const url = `/uploads/store/${req.file.filename}`;
    return res.status(201).json({ message: "Imagen subida", type: kind, url });
  } catch {
    return res.status(500).json({ message: "Error subiendo imagen" });
  }
};

const getPublicStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: String(slug) }, { _id: 0 }).lean();
    if (!store) return res.status(404).json({ message: "Tienda no encontrada" });

    const products = await Product.find(
      { userId: Number(store.ownerId), $or: [{ status: "published" }, { status: { $exists: false } }] },
      { _id: 0 }
    )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ store, total: products.length, products });
  } catch {
    return res.status(500).json({ message: "Error al obtener tienda" });
  }
};

const listPublicStores = async (req, res) => {
  try {
    const limitRaw = req.query?.limit;
    const offsetRaw = req.query?.offset;
    const limit = Math.max(1, Math.min(20, Number(limitRaw || 3) || 3));
    const offset = Math.max(0, Number(offsetRaw || 0) || 0);

    const filter = { status: "active" };
    const projection = {
      _id: 0,
      id: 1,
      slug: 1,
      name: 1,
      description: 1,
      logoUrl: 1,
      bannerUrl: 1,
      themePrimary: 1,
      themeAccent: 1,
      themeBackground: 1,
      updatedAt: 1,
      createdAt: 1,
    };

    const [total, stores] = await Promise.all([
      Store.countDocuments(filter),
      Store.find(filter, projection)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ total, stores });
  } catch {
    return res.status(500).json({ message: "Error al listar tiendas" });
  }
};

module.exports = {
  requireStoreSubscription,
  getMyStore,
  upsertMyStore,
  getPublicStoreBySlug,
  uploadMyStoreAsset,
  listPublicStores,
};
