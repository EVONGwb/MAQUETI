const db = require("../config/db");

const dbAll = (sql, params) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

const dbGet = (sql, params) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });

const dbRun = (sql, params) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const sql = `
      SELECT c.*, 
             p.title as productTitle, p.imageUrl as productImageUrl, p.price as productPrice,
             b.name as buyerName, b.email as buyerEmail,
             s.name as sellerName, s.email as sellerEmail
      FROM conversations c
      JOIN products p ON c.productId = p.id
      JOIN users b ON c.buyerId = b.id
      JOIN users s ON c.sellerId = s.id
      WHERE c.buyerId = ? OR c.sellerId = ?
      ORDER BY c.lastMessageAt DESC
    `;
    const conversations = await dbAll(sql, [userId, userId]);
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener conversaciones" });
  }
};

// POST /api/conversations
const createOrGetConversation = async (req, res) => {
  try {
    const buyerId = req.user?.id;
    const { productId } = req.body;
    if (!buyerId) return res.status(401).json({ message: "No autorizado" });
    if (!productId) return res.status(400).json({ message: "productId requerido" });

    const product = await dbGet("SELECT userId FROM products WHERE id = ?", [productId]);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });

    const sellerId = product.userId;
    if (String(buyerId) === String(sellerId)) {
      return res.status(400).json({ message: "No puedes iniciar una conversación contigo mismo" });
    }

    let conv = await dbGet("SELECT * FROM conversations WHERE productId = ? AND buyerId = ? AND sellerId = ?", [productId, buyerId, sellerId]);
    
    if (!conv) {
      const result = await dbRun(
        "INSERT INTO conversations (productId, buyerId, sellerId) VALUES (?, ?, ?)",
        [productId, buyerId, sellerId]
      );
      conv = await dbGet("SELECT * FROM conversations WHERE id = ?", [result.lastID]);
    }
    
    res.json({ conversation: conv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear conversación" });
  }
};

// GET /api/conversations/:id
const getConversationById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const sql = `
      SELECT c.*, 
             p.title as productTitle, p.imageUrl as productImageUrl, p.price as productPrice,
             b.name as buyerName, b.email as buyerEmail,
             s.name as sellerName, s.email as sellerEmail
      FROM conversations c
      JOIN products p ON c.productId = p.id
      JOIN users b ON c.buyerId = b.id
      JOIN users s ON c.sellerId = s.id
      WHERE c.id = ?
    `;
    const conv = await dbGet(sql, [id]);
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });

    if (String(conv.buyerId) !== String(userId) && String(conv.sellerId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado para ver esta conversación" });
    }

    res.json({ conversation: conv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener conversación" });
  }
};

// GET /api/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await dbGet("SELECT buyerId, sellerId FROM conversations WHERE id = ?", [id]);
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });
    if (String(conv.buyerId) !== String(userId) && String(conv.sellerId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const messages = await dbAll("SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC", [id]);
    const parsedMessages = messages.map(m => ({
      ...m,
      images: JSON.parse(m.images || '[]'),
      readBy: JSON.parse(m.readBy || '[]')
    }));

    res.json({ messages: parsedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
};

// POST /api/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { text } = req.body;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await dbGet("SELECT buyerId, sellerId FROM conversations WHERE id = ?", [id]);
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });
    if (String(conv.buyerId) !== String(userId) && String(conv.sellerId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/chat/${file.filename}`);
      });
    }

    if (!text && images.length === 0) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    const imagesJson = JSON.stringify(images);
    const readByJson = JSON.stringify([userId]);
    const createdAt = Date.now();

    const result = await dbRun(
      "INSERT INTO messages (conversationId, senderId, text, images, readBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, userId, text || "", imagesJson, readByJson, createdAt, createdAt]
    );

    let lastMsgText = text || "📷 Imagen adjunta";
    await dbRun(
      "UPDATE conversations SET lastMessage = ?, lastMessageAt = ?, updatedAt = ? WHERE id = ?",
      [lastMsgText, createdAt, createdAt, id]
    );

    const newMsg = await dbGet("SELECT * FROM messages WHERE id = ?", [result.lastID]);
    newMsg.images = JSON.parse(newMsg.images);
    newMsg.readBy = JSON.parse(newMsg.readBy);

    res.json({ message: newMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al enviar mensaje" });
  }
};

// PATCH /api/conversations/:id/read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const conv = await dbGet("SELECT buyerId, sellerId FROM conversations WHERE id = ?", [id]);
    if (!conv) return res.status(404).json({ message: "Conversación no encontrada" });
    if (String(conv.buyerId) !== String(userId) && String(conv.sellerId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const messages = await dbAll("SELECT id, readBy FROM messages WHERE conversationId = ?", [id]);
    for (const msg of messages) {
      let readBy = JSON.parse(msg.readBy || '[]');
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await dbRun("UPDATE messages SET readBy = ? WHERE id = ?", [JSON.stringify(readBy), msg.id]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al marcar como leídos" });
  }
};

module.exports = {
  getConversations,
  createOrGetConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markAsRead
};
