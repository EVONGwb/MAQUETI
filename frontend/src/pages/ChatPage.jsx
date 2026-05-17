import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getConversationById, getConversationMessages, getUserConversations, markConversationAsRead, resolveImageSrc, sendConversationMessage } from "../services/api";
import { priceLabel } from "../services/format";

export function ChatListPage({ token, user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getUserConversations(token);
        setConversations(data.conversations || []);
      } catch (err) {
        if (err?.nonJson) {
          setError("Respuesta inesperada del servidor. Revisa que VITE_API_URL apunte al backend.");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchConversations();
  }, [token]);

  if (loading) return <div className="view-container">Cargando chats...</div>;
  if (error) return <div className="view-container"><div className="error">{error}</div></div>;

  return (
    <div className="view-container">
      <h2>Mensajes</h2>
      {conversations.length === 0 ? (
        <div className="empty-state">No tienes conversaciones todavía.</div>
      ) : (
        <div className="feed-list">
          {conversations.map((conv) => {
            const isBuyer = String(conv.buyerId) === String(user?.id);
            const otherName = isBuyer ? conv.sellerName : conv.buyerName;
            const img = conv.productImageUrl ? resolveImageSrc(conv.productImageUrl) : "";

            return (
                <div
                  key={conv.id}
                  className="chat-row"
                  onClick={() => navigate(`/chats/${conv.id}`, { state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } } })}
                  style={{ cursor: "pointer" }}
                >
                <div
                  className="chat-row-thumb placeholder-img"
                  style={img ? { backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                ></div>
                <div className="chat-row-details">
                  <h4 className="chat-row-title">{conv.productTitle}</h4>
                  <p className="chat-row-subtitle">Con: {otherName || "Usuario"}</p>
                  <p className="chat-row-preview">{conv.lastMessage}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatDetailPage({ token, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [convData, setConvData] = useState(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const socketRef = useRef(null);

  const fetchChat = async () => {
    try {
      const [convJson, msgJson] = await Promise.all([getConversationById(id, token), getConversationMessages(id, token)]);
      setConvData(convJson.conversation);
      setMessages(msgJson.messages || []);
      markConversationAsRead(id, token).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchChat();
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    const socket = io(getApiUrl(), { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_conversation", { conversationId: id });
    });

    socket.on("receive_message", (msg) => {
      if (!msg || String(msg.conversationId) !== String(id)) return;
      setMessages((prev) => (prev.some((m) => String(m.id) === String(msg.id)) ? prev : [...prev, msg]));
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert("Máximo 5 imágenes por mensaje");
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  useEffect(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [images.length]);

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;

    setSending(true);
    try {
      if (images.length === 0 && socketRef.current && text.trim()) {
        const payload = { conversationId: id, text: text.trim() };
        await new Promise((resolve, reject) => {
          socketRef.current.emit("send_message", payload, (ack) => {
            if (ack?.ok) return resolve();
            return reject(new Error(ack?.message || "No se pudo enviar el mensaje"));
          });
        });
        setText("");
        markConversationAsRead(id, token).catch(() => {});
      } else {
        const data = await sendConversationMessage(id, token, { text, images });
        if (data?.message) {
          setMessages((prev) => (prev.some((m) => String(m.id) === String(data.message.id)) ? prev : [...prev, data.message]));
        }
        setText("");
        setImages([]);
      }

    } catch (err) {
      if (err?.nonJson) {
        alert("Respuesta inesperada del servidor. Revisa que VITE_API_URL apunte al backend.");
      } else {
        alert(err.message);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="view-container">Cargando...</div>;
  if (!convData) return <div className="view-container">Conversación no encontrada</div>;

  const isBuyer = String(convData.buyerId) === String(user?.id);
  const otherName = isBuyer ? convData.sellerName : convData.buyerName;
  const productImg = resolveImageSrc(convData.productImageUrl);
  const handleBack = () => {
    const from = location.state?.from;
    const pathname = typeof from === "string" ? from : from?.pathname;
    const search = typeof from === "object" && from?.search ? from.search : "";
    const hash = typeof from === "object" && from?.hash ? from.hash : "";
    const isSafeAppPath = typeof pathname === "string" && pathname.startsWith("/") && pathname !== location.pathname && !pathname.startsWith("/chats/");

    navigate(isSafeAppPath ? `${pathname}${search}${hash}` : "/chats", { replace: true });
  };

  return (
    <div className="chat-page">
      <main className="chat-main">
        <div className="chat-inline-head">
          <button className="chat-back-btn" onClick={handleBack} type="button">
            ←
          </button>
          <div className="chat-header-info">
            <h1>{convData.productTitle}</h1>
            <p>Chat con {otherName}</p>
          </div>
          <button className="chat-more-btn" type="button" aria-label="Opciones del chat">
            ⋯
          </button>
        </div>

        <div className="chat-product-banner">
          <button
            className="chat-product-mini"
            type="button"
            onClick={() => {
              if (convData.productId) {
                navigate(`/product/${convData.productId}`, {
                  state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } },
                });
              }
            }}
          >
            <img className="chat-product-thumb" src={productImg} alt={convData.productTitle} />
            <div>
              <strong>{convData.productTitle}</strong>
              <p>Precio: {priceLabel(convData.productPrice)}</p>
            </div>
            {convData.productId ? <span className="chat-product-open">Ver</span> : null}
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((message) => {
            const mine = String(message.senderId) === String(user?.id);
            return (
              <div key={message.id} className={`chat-bubble-row ${mine ? "mine" : "other"}`}>
                <div className={`chat-bubble ${mine ? "mine" : "other"}`}>
                  {message.text ? <p>{message.text}</p> : null}
                  {Array.isArray(message.images) && message.images.length > 0 ? (
                    <div className="chat-images">
                      {message.images.map((img, i) => {
                        const src = resolveImageSrc(img);
                        return <img key={i} src={src} alt="adjunto" onClick={() => setPreviewImage(src)} />;
                      })}
                    </div>
                  ) : null}
                  <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="chat-composer">
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect} />
        <button className="chat-attach-btn" type="button" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={18} />
        </button>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend(e);
          }}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={sending || (!text.trim() && images.length === 0)} type="button">
          <Send size={18} />
        </button>
      </div>

      {previewImage ? (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPreviewImage(null)}>
          <button style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "white", cursor: "pointer" }} onClick={() => setPreviewImage(null)} type="button">
            <X size={32} />
          </button>
          <img src={previewImage} alt="Preview" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
        </div>
      ) : null}
    </div>
  );
}
