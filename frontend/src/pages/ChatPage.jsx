import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Image as ImageIcon, Send, X } from "lucide-react";
import { getApiUrl, parseJsonResponse, resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export function ChatListPage({ token, user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseJsonResponse(res);
        if (!res.ok) throw new Error(data.message || "Error al cargar chats");
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
              <div key={conv.id} className="feed-item" onClick={() => navigate(`/chats/${conv.id}`)} style={{ cursor: "pointer" }}>
                <div
                  className="feed-img placeholder-img"
                  style={img ? { backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", width: "60px", height: "60px", flexShrink: 0 } : { width: "60px", height: "60px", flexShrink: 0 }}
                ></div>
                <div className="feed-details" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "15px" }}>{conv.productTitle}</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>Con: {otherName || "Usuario"}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.lastMessage}</p>
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
  const [messages, setMessages] = useState([]);
  const [convData, setConvData] = useState(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchChat = async () => {
    try {
      const apiUrl = getApiUrl();
      const [convRes, msgRes] = await Promise.all([
        fetch(`${apiUrl}/api/conversations/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/conversations/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const convJson = await parseJsonResponse(convRes);
      if (!convRes.ok) throw new Error(convJson?.message || "Error al cargar la conversación");

      const msgJson = await parseJsonResponse(msgRes);
      if (!msgRes.ok) throw new Error(msgJson?.message || "Error al cargar los mensajes");

      setConvData(convJson.conversation);
      setMessages(msgJson.messages || []);

      fetch(`${apiUrl}/api/conversations/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchChat();
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

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;

    setSending(true);
    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      if (text.trim()) formData.append("text", text);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch(`${apiUrl}/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.message || "Error al enviar mensaje");

      setText("");
      setImages([]);
      await fetchChat();
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

  return (
    <div className="chat-layout" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="chat-header" style={{ padding: "15px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "15px", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="back-btn" style={{ position: "static", margin: 0 }} onClick={() => navigate(-1)}>
          <ChevronLeft />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="placeholder-img" style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundImage: `url(${productImg})`, backgroundSize: "cover" }}></div>
          <div>
            <h4 style={{ margin: 0, fontSize: "15px" }}>{convData.productTitle}</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{otherName}</p>
          </div>
        </div>
        <div style={{ fontWeight: "bold", color: "#ff5a00" }}>{priceLabel(convData.productPrice)}</div>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column", gap: "10px", background: "#f8f9fa" }}>
        {messages.map((msg) => {
          const isMine = String(msg.senderId) === String(user?.id);
          return (
            <div key={msg.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div style={{ background: isMine ? "#ff5a00" : "#fff", color: isMine ? "#fff" : "#333", padding: "10px 15px", borderRadius: "16px", borderBottomRightRadius: isMine ? "4px" : "16px", borderBottomLeftRadius: isMine ? "16px" : "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                {msg.text ? <p style={{ margin: 0, wordBreak: "break-word" }}>{msg.text}</p> : null}

                {Array.isArray(msg.images) && msg.images.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: msg.text ? "8px" : "0" }}>
                    {msg.images.map((img, i) => {
                      const src = resolveImageSrc(img);
                      return (
                        <img
                          key={i}
                          src={src}
                          alt="adjunto"
                          style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }}
                          onClick={() => setPreviewImage(src)}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "4px", textAlign: isMine ? "right" : "left" }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input" style={{ padding: "10px", background: "#fff", borderTop: "1px solid #eee", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
        {images.length > 0 ? (
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", overflowX: "auto", paddingBottom: "5px" }}>
            {images.map((file, i) => (
              <div key={i} style={{ position: "relative", width: "60px", height: "60px", flexShrink: 0 }}>
                <img src={URL.createObjectURL(file)} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ff3333", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <form onSubmit={handleSend} style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", padding: "10px", color: "#666", cursor: "pointer" }}>
            <ImageIcon size={24} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            style={{ flex: 1, border: "1px solid #ddd", borderRadius: "20px", padding: "10px 15px", resize: "none", outline: "none", fontFamily: "inherit", fontSize: "15px", maxHeight: "100px" }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" disabled={sending || (!text.trim() && images.length === 0)} style={{ background: "#ff5a00", color: "white", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: sending || (!text.trim() && images.length === 0) ? 0.5 : 1 }}>
            <Send size={20} style={{ marginLeft: "-2px" }} />
          </button>
        </form>
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
