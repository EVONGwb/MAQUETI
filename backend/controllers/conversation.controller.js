const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { getIO } = require("../socket");

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const enrichConversations = async (conversations) => {
  const productIds = Array.from(new Set(conversations.map((c) => c.productId)));
  const userIds = Array.from(new Set(conversations.flatMap((c) => [c.buyerId, c.sellerId])));

  const [products, users] = await Promise.all([
    Product.find({ id: { $in: productIds } }, { _id: 0 }).lean(),
    User.find({ id: { $in: userIds } }, { id: 1, name: 1, email: 1, _id: 0 }).lean(),
  ]);

  const productsById = new Map(products.map((p) => [String(p.id), p]));
  const usersById = new Map(users.map((u) => [String(u.id), u]));

  return conversations.map((c) => {
    const p = productsById.get(String(c.productId)) || null;
    const b = usersById.get(String(c.buyerId)) || null;
    const s = usersById.get(String(c.sellerId)) || null;
    const firstImage = Array.isArray(p?.imageUrls) && p.imageUrls.length ? p.imageUrls[0] : p?.imageUrl;
    return {
      ...c,
      productTitle: p?.title,
      productImageUrl: firstImage,
      productPrice: p?.price,
      buyerName: b?.name,
      buyerEmail: b?.email,
      sellerName: s?.name,
      sellerEmail: s?.email,
    };
  });
};

const assertParticipant = (conversation, userId) =>
  String(conversation.buyerId) === String(userId) || String(conversation.sellerId) === String(userId);

const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conversations = await Conversation.find(
      { $or: [{ buyerId: Number(userId) }, { sellerId: Number(userId) }] },
      { _id: 0 }
    )
      .sort({ lastMessageAt: -1 })
      .lean();

    const enriched = await enrichConversations(conversations);
    res.json({ conversations: enriched });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener conversaciones" });
  }
};

const createOrGetConversation = async (req, res) => {
  try {
    const buyerId = req.user?.id;
    const { productId } = req.body;
    if (!buyerId) return res.status(401).json({ message: "No autorizado" });
    if (!productId) return res.status(400).json({ message: "productId requerido" });

    const product = await Product.findOne({ id: Number(productId) }, { userId: 1, _id: 0 }).lean();
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const sellerId = product.userId;
    if (String(buyerId) === String(sellerId)) {
      return res.status(400).json({ message: "No puedes iniciar una conversación contigo mismo" });
    }

    let conv = await Conversation.findOne(
      { productId: Number(productId), buyerId: Number(buyerId), sellerId: Number(sellerId) },
      { _id: 0 }
    ).lean();

    if (!conv) {
      const now = Date.now();
      const doc = await Conversation.create({
        id: generateNumericId(),
        productId: Number(productId),
        buyerId: Number(buyerId),
        sellerId: Number(sellerId),
        lastMessage: "",
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      }).catch(async () => {
        return null;
      });

      if (doc) {
        conv = doc.toObject();
        delete conv._id;
      } else {
        conv = await Conversation.findOne(
          { productId: Number(productId), buyerId: Number(buyerId), sellerId: Number(sellerId) },
          { _id: 0 }
        ).lean();
      }
    }

    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ message: "Error al crear conversación" });
  }
};

const getConversationById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await Conversation.findOne({ id: Number(id) }, { _id: 0 }).lean();
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });

    if (!assertParticipant(conv, userId)) {
      return res.status(403).json({ message: "No autorizado para ver esta conversación" });
    }

    const enriched = (await enrichConversations([conv]))[0];
    res.json({ conversation: enriched });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener conversación" });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await Conversation.findOne({ id: Number(id) }, { buyerId: 1, sellerId: 1, _id: 0 }).lean();
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });
    if (!assertParticipant(conv, userId)) return res.status(403).json({ message: "No autorizado" });

    const messages = await Message.find({ conversationId: Number(id) }, { _id: 0 })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { text } = req.body;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await Conversation.findOne({ id: Number(id) }, { buyerId: 1, sellerId: 1, _id: 0 }).lean();
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });
    if (!assertParticipant(conv, userId)) return res.status(403).json({ message: "No autorizado" });

    const uploadedImages = Array.isArray(req.files) ? req.files.map((file) => `/uploads/chat/${file.filename}`) : [];
    const rawImageUrls = req.body?.imageUrls;
    const urlImages = Array.isArray(rawImageUrls)
      ? rawImageUrls.filter((u) => typeof u === "string" && u.trim())
      : typeof rawImageUrls === "string" && rawImageUrls.trim()
      ? [rawImageUrls.trim()]
      : [];

    const images = [...uploadedImages, ...urlImages].slice(0, 5);

    if (!text && images.length === 0) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    const createdAt = Date.now();
    const newMsg = await Message.create({
      id: generateNumericId(),
      conversationId: Number(id),
      senderId: Number(userId),
      text: text || "",
      images,
      readBy: [Number(userId)],
      createdAt,
      updatedAt: createdAt,
    });

    const lastMsgText = text || "📷 Imagen adjunta";
    await Conversation.updateOne(
      { id: Number(id) },
      { $set: { lastMessage: lastMsgText, lastMessageAt: createdAt, updatedAt: createdAt } }
    );

    const out = newMsg.toObject();
    delete out._id;
    try {
      const io = getIO();
      if (io) io.to(`conversation:${Number(id)}`).emit("receive_message", out);
    } catch {}
    res.json({ message: out });
  } catch (err) {
    res.status(500).json({ message: "Error al enviar mensaje" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await Conversation.findOne({ id: Number(id) }, { buyerId: 1, sellerId: 1, _id: 0 }).lean();
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });
    if (!assertParticipant(conv, userId)) return res.status(403).json({ message: "No autorizado" });

    await Message.updateMany(
      { conversationId: Number(id), readBy: { $ne: Number(userId) } },
      { $addToSet: { readBy: Number(userId) } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error al marcar como leídos" });
  }
};

module.exports = {
  getConversations,
  createOrGetConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markAsRead,
};
