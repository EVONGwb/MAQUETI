const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Conversation = require("./models/conversation.model");
const Message = require("./models/message.model");
const { getAllowedOrigins } = require("./config/cors");

let io;

const initSocket = (httpServer) => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const secret = process.env.JWT_SECRET || (nodeEnv === "production" ? "" : "maqueti_secret");

  io = new Server(httpServer, {
    cors: { origin: getAllowedOrigins(), credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
    if (!token) return next(new Error("unauthorized"));
    if (!secret) return next(new Error("server_misconfigured"));
    try {
      const decoded = jwt.verify(token, secret);
      socket.user = decoded;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_conversation", async ({ conversationId } = {}, ack) => {
      try {
        const id = Number(conversationId);
        if (!id) throw new Error("conversationId inválido");
        const conv = await Conversation.findOne({ id }, { buyerId: 1, sellerId: 1, _id: 0 }).lean();
        if (!conv) throw new Error("Conversación no encontrada");
        const userId = Number(socket.user?.id);
        if (![Number(conv.buyerId), Number(conv.sellerId)].includes(userId)) throw new Error("No autorizado");
        socket.join(`conversation:${id}`);
        if (typeof ack === "function") ack({ ok: true });
      } catch (e) {
        if (typeof ack === "function") ack({ ok: false, message: e?.message || "Error" });
      }
    });

    socket.on("send_message", async ({ conversationId, text } = {}, ack) => {
      try {
        const id = Number(conversationId);
        const userId = Number(socket.user?.id);
        const messageText = String(text || "").trim();
        if (!id) throw new Error("conversationId inválido");
        if (!messageText) throw new Error("El mensaje no puede estar vacío");

        const conv = await Conversation.findOne({ id }, { buyerId: 1, sellerId: 1, _id: 0 }).lean();
        if (!conv) throw new Error("Conversación no encontrada");
        if (![Number(conv.buyerId), Number(conv.sellerId)].includes(userId)) throw new Error("No autorizado");

        const createdAt = Date.now();
        const msg = await Message.create({
          id: createdAt * 1000 + Math.floor(Math.random() * 1000),
          conversationId: id,
          senderId: userId,
          text: messageText,
          images: [],
          readBy: [userId],
          createdAt,
          updatedAt: createdAt,
        });

        await Conversation.updateOne(
          { id },
          { $set: { lastMessage: messageText, lastMessageAt: createdAt, updatedAt: createdAt } }
        );

        const out = msg.toObject();
        delete out._id;
        io.to(`conversation:${id}`).emit("receive_message", out);
        if (typeof ack === "function") ack({ ok: true, message: out });
      } catch (e) {
        if (typeof ack === "function") ack({ ok: false, message: e?.message || "Error" });
      }
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
