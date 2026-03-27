import React, { useEffect, useMemo, useState, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Home, Search, PlusSquare, User, Package, Store as StoreIcon, LogOut, Fingerprint, RefreshCcw, ChevronLeft, Heart, MessageCircle, Send, Image as ImageIcon, X } from "lucide-react";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") return "http://localhost:3005";
  return "https://maqueti.onrender.com";
};

const parseJsonResponse = async (res) => {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const bodyText = await res.text();
  const err = new Error(`Respuesta inesperada del servidor (HTTP ${res.status})`);
  err.nonJson = true;
  err.bodyText = bodyText;
  throw err;
};

const decodeJwtPayload = (token) => {
  try {
    const part = token.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isJwtExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

const priceLabel = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  return `${Number(value)} €`;
};

const AuthRequiredView = ({ title, message, onLogin }) => {
  return (
    <div className="view-container">
      <h2>{title}</h2>
      <div className="empty-state">{message}</div>
      <button className="primary-btn" type="button" style={{ marginTop: "14px" }} onClick={onLogin}>
        Regístrate o inicia sesión
      </button>
    </div>
  );
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)} style={{cursor: 'pointer'}}>
      <div 
        className="product-img placeholder-img" 
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      ></div>
      <div className="product-info">
        <h4>{product.title}</h4>
        <div className="product-meta">
          <span className="tag new">{product.condition || "—"}</span>
          {product.location ? <span className="tag zone">{product.location}</span> : null}
        </div>
        <p className="price">{priceLabel(product.price)}</p>
      </div>
    </div>
  );
};

const HomeView = ({ products, search, setSearch, categories, activeCategory, setActiveCategory, loading }) => {
  const filtered = useMemo(() => {
    const byCategory = activeCategory ? products.filter((p) => (p.category || "Otros") === activeCategory) : products;
    if (!search) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((p) => String(p.title || "").toLowerCase().includes(q));
  }, [products, search, activeCategory]);

  return (
    <div className="view-container">
      <div className="search-bar">
        <Search size={20} color="#666" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Buscar productos..." />
      </div>
      <div className="banner">
        <h2>Ofertas de la semana</h2>
        <p>Productos nuevos cada día</p>
      </div>

      <h3>Categorías</h3>
      <div className="categories">
        <button className={`cat-chip ${activeCategory ? "" : "active"}`} type="button" onClick={() => setActiveCategory("")}>
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`cat-chip ${activeCategory === c ? "active" : ""}`}
            type="button"
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <h3>Cerca de ti</h3>
      {loading ? (
        <div className="product-grid">
          {[1,2,3,4].map(n => <div key={n} className="skeleton skeleton-card"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No hay productos todavía.</div>
      ) : (
        <div className="product-grid">
          {filtered.slice(0, 12).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

const ExploreView = ({ products, search, setSearch, categories, activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();
  const filtered = useMemo(() => {
    const byCategory = activeCategory ? products.filter((p) => (p.category || "Otros") === activeCategory) : products;
    if (!search) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((p) => String(p.title || "").toLowerCase().includes(q) || String(p.description || "").toLowerCase().includes(q));
  }, [products, search, activeCategory]);

  return (
    <div className="view-container">
      <div className="search-bar">
        <Search size={20} color="#666" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Buscar en todo el catálogo..." />
      </div>

      <div className="categories" style={{ marginBottom: '20px' }}>
        <button className={`cat-chip ${activeCategory ? "" : "active"}`} type="button" onClick={() => setActiveCategory("")}>
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`cat-chip ${activeCategory === c ? "active" : ""}`}
            type="button"
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <h2>Explorar {activeCategory ? `- ${activeCategory}` : ""}</h2>
      {filtered.length === 0 ? <div className="empty-state">No se encontraron productos con esos filtros.</div> : null}
      <div className="feed-list">
        {filtered.map((p) => (
          <div key={p.id} className="feed-item" onClick={() => navigate(`/product/${p.id}`)} style={{cursor: 'pointer'}}>
            <div 
              className="feed-img placeholder-img"
              style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            ></div>
            <div className="feed-details">
              <h4>{p.title}</h4>
              <div className="product-meta">
                <span className="tag new">{p.condition || "—"}</span>
                {(p.category || "Otros") ? <span className="tag zone">{p.category || "Otros"}</span> : null}
              </div>
              <p className="price-large">{priceLabel(p.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductDetailView = ({ products, toggleFavorite, favorites, onRequireAuth }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p) => String(p.id) === String(id));
  const [contactMessage, setContactMessage] = useState("");

  if (!product) {
    return (
      <div className="view-container">
        <div className="back-btn" onClick={() => navigate(-1)}><ChevronLeft /></div>
        <div className="empty-state" style={{marginTop: '60px'}}>Producto no encontrado</div>
      </div>
    );
  }

  const isFav = favorites.includes(product.id);

  const handleContactSeller = async () => {
    setContactMessage("");
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem("token") || "";
      if (!token) {
        onRequireAuth?.();
        return;
      }

      const res = await fetch(`${apiUrl}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.message || "No se pudo iniciar la conversación");

      navigate(`/chats/${data.conversation.id}`);
    } catch (e) {
      if (e?.nonJson) {
        setContactMessage("Respuesta inesperada del servidor. Revisa que VITE_API_URL apunte al backend.");
      } else {
        setContactMessage(e?.message || "No se pudo contactar con el vendedor");
      }
    }
  };

  return (
    <div className="product-detail-view">
      <div 
        className="product-detail-image"
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : {}}
      >
        <div className="back-btn" onClick={() => navigate(-1)}><ChevronLeft /></div>
      </div>
      
      <div className="product-detail-content">
        <p className="product-detail-price">{priceLabel(product.price)}</p>
        <h2 className="product-detail-title">{product.title}</h2>
        
        <div className="product-detail-meta">
          <span className="tag new">{product.condition || "—"}</span>
          <span className="tag zone">{product.category || "Otros"}</span>
          {product.location && <span className="tag zone">{product.location}</span>}
        </div>

        <h3>Descripción</h3>
        <p className="product-detail-desc">
          {product.description || "El vendedor no ha añadido una descripción para este producto."}
        </p>

        {product.stock !== null && product.stock !== undefined && (
          <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>
            Stock disponible: <strong>{product.stock}</strong> unidades
          </p>
        )}

        <div className="action-bar">
          <button className="chat-btn" onClick={handleContactSeller}>Contactar vendedor</button>
          <button 
            className="chat-btn" 
            style={{background: isFav ? '#ff5a00' : '#fff', color: isFav ? '#fff' : '#ff5a00', border: '1px solid #ff5a00', transition: 'all 0.2s'}}
            onClick={() => toggleFavorite(product.id)}
          >
            <Heart size={20} fill={isFav ? "white" : "none"} />
          </button>
        </div>
        {contactMessage ? <div className="error" style={{ marginTop: "12px" }}>{contactMessage}</div> : null}
      </div>
    </div>
  );
};

const ChatListView = ({ token, user }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
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
          {conversations.map(conv => {
            const isBuyer = String(conv.buyerId) === String(user?.id);
            const otherName = isBuyer ? conv.sellerName : conv.buyerName;
            
            return (
              <div key={conv.id} className="feed-item" onClick={() => navigate(`/chats/${conv.id}`)} style={{cursor: 'pointer'}}>
                <div 
                  className="feed-img placeholder-img"
                  style={conv.productImageUrl ? { backgroundImage: `url(${conv.productImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '60px', height: '60px', flexShrink: 0 } : { width: '60px', height: '60px', flexShrink: 0 }}
                ></div>
                <div className="feed-details" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <h4 style={{margin: '0 0 4px 0', fontSize: '15px'}}>{conv.productTitle}</h4>
                  <p style={{margin: 0, fontSize: '13px', color: '#666'}}>Con: {otherName || "Usuario"}</p>
                  <p style={{margin: '4px 0 0 0', fontSize: '14px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ChatDetailView = ({ token, user }) => {
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
        fetch(`${apiUrl}/api/conversations/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const convJson = await parseJsonResponse(convRes);
      if (!convRes.ok) throw new Error(convJson?.message || "Error al cargar la conversación");

      const msgJson = await parseJsonResponse(msgRes);
      if (!msgRes.ok) throw new Error(msgJson?.message || "Error al cargar los mensajes");
      
      setConvData(convJson.conversation);
      setMessages(msgJson.messages || []);
      
      // Marcar leídos
      fetch(`${apiUrl}/api/conversations/${id}/read`, { 
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;
    
    setSending(true);
    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      if (text.trim()) formData.append("text", text);
      images.forEach(img => formData.append("images", img));

      const res = await fetch(`${apiUrl}/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
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
  const apiUrl = getApiUrl();

  return (
    <div className="chat-layout" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div className="chat-header" style={{padding: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', position: 'sticky', top: 0, zIndex: 10}}>
        <div className="back-btn" style={{position: 'static', margin: 0}} onClick={() => navigate(-1)}><ChevronLeft /></div>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div className="placeholder-img" style={{width: '40px', height: '40px', borderRadius: '8px', backgroundImage: `url(${convData.productImageUrl})`, backgroundSize: 'cover'}}></div>
          <div>
            <h4 style={{margin: 0, fontSize: '15px'}}>{convData.productTitle}</h4>
            <p style={{margin: 0, fontSize: '12px', color: '#666'}}>{otherName}</p>
          </div>
        </div>
        <div style={{fontWeight: 'bold', color: '#ff5a00'}}>{priceLabel(convData.productPrice)}</div>
      </div>

      <div className="chat-messages" style={{flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f9fa'}}>
        {messages.map(msg => {
          const isMine = String(msg.senderId) === String(user?.id);
          return (
            <div key={msg.id} style={{alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%'}}>
              <div style={{
                background: isMine ? '#ff5a00' : '#fff',
                color: isMine ? '#fff' : '#333',
                padding: '10px 15px',
                borderRadius: '16px',
                borderBottomRightRadius: isMine ? '4px' : '16px',
                borderBottomLeftRadius: isMine ? '16px' : '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {msg.text && <p style={{margin: 0, wordBreak: 'break-word'}}>{msg.text}</p>}
                
                {msg.images && msg.images.length > 0 && (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: msg.text ? '8px' : '0'}}>
                    {msg.images.map((img, i) => (
                      <img 
                        key={i} 
                        src={`${apiUrl}${img}`} 
                        alt="adjunto" 
                        style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer'}}
                        onClick={() => setPreviewImage(`${apiUrl}${img}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div style={{fontSize: '11px', color: '#999', marginTop: '4px', textAlign: isMine ? 'right' : 'left'}}>
                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input" style={{padding: '10px', background: '#fff', borderTop: '1px solid #eee', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))'}}>
        {images.length > 0 && (
          <div style={{display: 'flex', gap: '10px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '5px'}}>
            {images.map((file, i) => (
              <div key={i} style={{position: 'relative', width: '60px', height: '60px', flexShrink: 0}}>
                <img src={URL.createObjectURL(file)} alt="preview" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} />
                <button 
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{position: 'absolute', top: '-5px', right: '-5px', background: '#ff3333', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0}}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} style={{display: 'flex', alignItems: 'flex-end', gap: '10px'}}>
          <input 
            type="file" 
            multiple 
            accept="image/jpeg,image/png,image/webp" 
            ref={fileInputRef} 
            style={{display: 'none'}} 
            onChange={handleImageSelect}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{background: 'none', border: 'none', padding: '10px', color: '#666', cursor: 'pointer'}}>
            <ImageIcon size={24} />
          </button>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            style={{flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '10px 15px', resize: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '15px', maxHeight: '100px'}}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" disabled={sending || (!text.trim() && images.length === 0)} style={{background: '#ff5a00', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (sending || (!text.trim() && images.length === 0)) ? 0.5 : 1}}>
            <Send size={20} style={{marginLeft: '-2px'}} />
          </button>
        </form>
      </div>

      {previewImage && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setPreviewImage(null)}>
          <button style={{position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer'}} onClick={() => setPreviewImage(null)}>
            <X size={32} />
          </button>
          <img src={previewImage} alt="Preview" style={{maxWidth: '90%', maxHeight: '90%', objectFit: 'contain'}} />
        </div>
      )}
    </div>
  );
};

const FavoritesView = ({ products, favorites }) => {
  const navigate = useNavigate();
  const favProducts = useMemo(() => {
    return products.filter((p) => favorites.includes(p.id));
  }, [products, favorites]);

  return (
    <div className="view-container">
      <h2>Mis Favoritos</h2>
      {favProducts.length === 0 ? (
        <div className="empty-state">No tienes ningún producto en favoritos.</div>
      ) : (
        <div className="feed-list">
          {favProducts.map((p) => (
            <div key={p.id} className="feed-item" onClick={() => navigate(`/product/${p.id}`)} style={{cursor: 'pointer'}}>
              <div 
                className="feed-img placeholder-img"
                style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              ></div>
              <div className="feed-details">
                <h4>{p.title}</h4>
                <div className="product-meta">
                  <span className="tag new">{p.condition || "—"}</span>
                  {(p.category || "Otros") ? <span className="tag zone">{p.category || "Otros"}</span> : null}
                </div>
                <p className="price-large">{priceLabel(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StoreView = ({ user, myProducts, onLogout, onRegisterPasskey, passkeyMessage }) => (
  <div className="view-container">
    <div className="store-header">
      <div className="store-banner placeholder-img"></div>
      <div className="store-profile">
        <div className="store-avatar"></div>
        <div>
          <h2>Mi Tienda</h2>
          <p>{user?.email || ""}</p>
        </div>
      </div>
    </div>

    <div className="store-stats">
      <div className="stat-box">
        <p>Productos</p>
        <h3>{myProducts.length}</h3>
      </div>
      <div className="stat-box">
        <p>Agotados</p>
        <h3>{myProducts.filter((p) => Number(p.stock || 0) === 0).length}</h3>
      </div>
    </div>

    <div className="btn-row">
      <button className="secondary-btn" type="button" onClick={onRegisterPasskey}>
        <Fingerprint size={18} /> Activar huella
      </button>
      <button className="logout-btn" type="button" onClick={onLogout}>
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
    {passkeyMessage ? <div className="msg">{passkeyMessage}</div> : null}

    <div className="store-tabs">
      <span className="active">Productos</span>
    </div>
    {myProducts.length === 0 ? <div className="empty-state">Publica tu primer producto.</div> : null}
    <div className="product-grid">
      {myProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </div>
);

const InventoryView = ({ myProducts }) => {
  const total = myProducts.length;
  const low = myProducts.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) < 3).length;

  return (
    <div className="view-container">
      <h2>Inventario</h2>
      <div className="inventory-metrics">
        <div className="metric">
          <span>Total</span>
          <strong>{total}</strong>
        </div>
        <div className={`metric ${low ? "alert" : ""}`}>
          <span>Stock bajo</span>
          <strong>{low}</strong>
        </div>
      </div>

      {myProducts.length === 0 ? <div className="empty-state">No hay productos en tu inventario.</div> : null}
      <div className="inventory-list">
        {myProducts.map((p) => {
          const s = p.stock === null || p.stock === undefined ? null : Number(p.stock);
          const status = s === null ? { cls: "in-stock", label: "Sin stock" } : s === 0 ? { cls: "out-stock", label: "Agotado" } : { cls: "in-stock", label: `En stock (${s})` };
          return (
            <div key={p.id} className="inventory-item">
              <div className="inv-info">
                <h4>{p.title}</h4>
                <p>{p.sku ? `SKU: ${p.sku}` : `Categoría: ${p.category || "Otros"}`}</p>
              </div>
              <div className={`inv-status ${status.cls}`}>{status.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AddProductView = ({ token, onCreated }) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Otros");
  const [condition, setCondition] = useState("Como nuevo");
  const [location, setLocation] = useState("");
  const [sku, setSku] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
  const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Falta configurar Cloudinary (VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET)");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || `No se pudo subir la imagen (cloud: ${CLOUDINARY_CLOUD_NAME}, preset: ${CLOUDINARY_UPLOAD_PRESET})`);
    }
    if (!data?.secure_url) {
      throw new Error("No se pudo obtener la URL de la imagen");
    }
    return data.secure_url;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage("");

    try {
      let uploadedUrl = "";
      if (imageFile) {
        uploadedUrl = await uploadImageToCloudinary(imageFile);
      }
      if (imageFile && !uploadedUrl) {
        throw new Error("No se pudo subir la imagen");
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          price: Number(price),
          description: description || null,
          stock: stock === "" ? null : Number(stock),
          category,
          condition,
          location: location || null,
          sku: sku || null,
          imageUrl: uploadedUrl || null
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message);
      
      setMessage(data.message || "Producto creado");
      setTitle("");
      setPrice("");
      setDescription("");
      setStock("");
      setCategory("Otros");
      setCondition("Como nuevo");
      setLocation("");
      setSku("");
      setImageFile(null);
      setImagePreview("");
      onCreated();
    } catch (err) {
      setMessage(err?.message || "Error al crear producto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="view-container">
      <h2>Subir Producto</h2>
      <form className="add-form" onSubmit={handleCreate}>
        <label className="image-upload" style={imagePreview ? { backgroundImage: `url(${imagePreview})`, backgroundSize: 'cover', backgroundPosition: 'center', border: 'none' } : {}}>
          {!imagePreview && <span>+ Añadir fotos</span>}
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </label>
        <input type="text" placeholder="Título del producto" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="number" placeholder="Precio (€)" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <div className="row-inputs">
          <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
          <input type="text" placeholder="SKU (Opcional)" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="row-inputs">
          <input type="text" placeholder="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input type="text" placeholder="Condición" value={condition} onChange={(e) => setCondition(e.target.value)} />
        </div>
        <input type="text" placeholder="Ubicación (opcional)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <textarea placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" className="primary-btn" disabled={uploading}>
          {uploading ? "Publicando..." : "Publicar"}
        </button>
      </form>
      {message ? <p className="msg">{message}</p> : null}
    </div>
  );
};

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authReason, setAuthReason] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [passkeyMessage, setPasskeyMessage] = useState("");
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };
  const location = useLocation();

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Otros"));
    return Array.from(set).slice(0, 12);
  }, [products]);

  const openAuth = (reason) => {
    setAuthReason(reason || "");
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
    setAuthReason("");
    setError("");
  };

  const fetchAllProducts = async () => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/products`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Error al obtener productos");
    return data.products || [];
  };

  const fetchMyProducts = async (tkn, userId) => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/products?userId=${userId}`, { headers: { Authorization: `Bearer ${tkn}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Error al obtener productos");
    return data.products || [];
  };

  const refreshData = async (tkn, usr) => {
    setLoading(true);
    setError("");
    try {
      const all = await fetchAllProducts();
      setProducts(all);
      if (tkn && usr?.id) {
        const mine = await fetchMyProducts(tkn, usr.id);
        setMyProducts(mine);
      } else {
        setMyProducts([]);
      }
    } catch (e) {
      setError(e?.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    const storedEmail = localStorage.getItem("userEmail") || "";
    const storedId = localStorage.getItem("userId") || "";
    const storedName = localStorage.getItem("userName") || "";

    if (storedToken && !isJwtExpired(storedToken)) {
      setIsLogged(true);
      setToken(storedToken);
      const u = {
        id: storedId ? Number(storedId) : null,
        email: storedEmail,
        name: storedName,
      };
      setUser(u);
      refreshData(storedToken, u);
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    refreshData("", null);
  }, []);

  const onAuthSuccess = async (data) => {
    if (!data?.token || !data?.user) return;
    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userId", String(data.user.id));
    localStorage.setItem("userName", data.user.name || "");
    setToken(data.token);
    setUser(data.user);
    setIsLogged(true);
    await refreshData(data.token, data.user);
    closeAuth();
    navigate("/");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error al iniciar sesión");
      await onAuthSuccess(data);
    } catch (e) {
      setError(e?.message || "Error al iniciar sesión");
    }
  };

  const handlePasskeyLogin = async () => {
    setError("");
    try {
      const apiUrl = getApiUrl();
      const optsRes = await fetch(`${apiUrl}/api/auth/webauthn/login/options`);
      const opts = await optsRes.json();
      if (!optsRes.ok) throw new Error(opts?.message || "Error al iniciar huella");
      
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const assertion = await startAuthentication(opts);
      
      const verifyRes = await fetch(`${apiUrl}/api/auth/webauthn/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data?.message || "Error al iniciar sesión con huella");
      await onAuthSuccess(data);
    } catch (e) {
      setError(e?.message || "No se pudo iniciar con huella");
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyMessage("");
    try {
      const apiUrl = getApiUrl();
      const optsRes = await fetch(`${apiUrl}/api/auth/webauthn/register/options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const opts = await optsRes.json();
      if (!optsRes.ok) throw new Error(opts?.message || "Error al iniciar huella");
      
      const { startRegistration } = await import("@simplewebauthn/browser");
      const attestation = await startRegistration(opts);
      
      const verifyRes = await fetch(`${apiUrl}/api/auth/webauthn/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(attestation),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data?.message || "Error al registrar huella");
      setPasskeyMessage(data?.message || "Huella registrada correctamente");
    } catch (e) {
      setPasskeyMessage(e?.message || "No se pudo registrar la huella");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setIsLogged(false);
    setToken("");
    setUser(null);
    setMyProducts([]);
    setError("");
    setPasskeyMessage("");
    refreshData("", null);
    navigate("/");
  };

  const activePath = location.pathname;

  return (
    <div className="app-layout">
      <div className="main-content">
        <div className="top-status">
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div className="muted">{isLogged ? (user?.email || "") : "Invitado"}</div>
            <div className="muted">API: {getApiUrl()}</div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {!isLogged ? (
              <button className="icon-btn" type="button" onClick={() => openAuth("Regístrate o inicia sesión para chatear y publicar.")}>
                <User size={18} />
              </button>
            ) : null}
            <button className="icon-btn" type="button" onClick={() => refreshData(token, user)} disabled={loading}>
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<HomeView products={products} search={search} setSearch={setSearch} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} loading={loading} />} />
          <Route path="/explore" element={<ExploreView products={products} search={search} setSearch={setSearch} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />} />
          <Route
            path="/add"
            element={
              isLogged ? <AddProductView token={token} onCreated={() => refreshData(token, user)} /> : <AuthRequiredView title="Subir Producto" message="Regístrate o inicia sesión para publicar productos." onLogin={() => openAuth("Regístrate o inicia sesión para publicar productos.")} />
            }
          />
          <Route
            path="/inventory"
            element={
              isLogged ? <InventoryView myProducts={myProducts} /> : <AuthRequiredView title="Inventario" message="Regístrate o inicia sesión para ver tu inventario." onLogin={() => openAuth("Regístrate o inicia sesión para ver tu inventario.")} />
            }
          />
          <Route
            path="/store"
            element={
              isLogged ? (
                <StoreView
                  user={user}
                  myProducts={myProducts}
                  onLogout={handleLogout}
                  onRegisterPasskey={handleRegisterPasskey}
                  passkeyMessage={passkeyMessage}
                />
              ) : (
                <AuthRequiredView title="Mi Tienda" message="Regístrate o inicia sesión para acceder a tu tienda." onLogin={() => openAuth("Regístrate o inicia sesión para acceder a tu tienda.")} />
              )
            }
          />
          <Route path="/product/:id" element={<ProductDetailView products={products} toggleFavorite={toggleFavorite} favorites={favorites} onRequireAuth={() => openAuth("Regístrate o inicia sesión para chatear con el vendedor.")} />} />
          <Route
            path="/chats"
            element={
              isLogged ? <ChatListView token={token} user={user} /> : <AuthRequiredView title="Mensajes" message="Regístrate o inicia sesión para ver tus chats." onLogin={() => openAuth("Regístrate o inicia sesión para ver tus chats.")} />
            }
          />
          <Route
            path="/chats/:id"
            element={
              isLogged ? <ChatDetailView token={token} user={user} /> : <AuthRequiredView title="Mensajes" message="Regístrate o inicia sesión para abrir este chat." onLogin={() => openAuth("Regístrate o inicia sesión para abrir este chat.")} />
            }
          />
          <Route path="/favorites" element={<FavoritesView products={products} favorites={favorites} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        <div className={`nav-item ${activePath === "/" ? "active" : ""}`} onClick={() => navigate("/")}>
          <Home size={24} />
          <span>Inicio</span>
        </div>
        <div className={`nav-item ${activePath === "/explore" ? "active" : ""}`} onClick={() => navigate("/explore")}>
          <Search size={24} />
          <span>Explorar</span>
        </div>
        <div className="nav-item add-btn" onClick={() => (isLogged ? navigate("/add") : openAuth("Regístrate o inicia sesión para publicar productos."))}>
          <div className="add-circle">
            <PlusSquare size={24} color="white" />
          </div>
        </div>
        <div className={`nav-item ${activePath.startsWith("/chats") ? "active" : ""}`} onClick={() => (isLogged ? navigate("/chats") : openAuth("Regístrate o inicia sesión para chatear."))}>
          <MessageCircle size={24} />
          <span>Buzón</span>
        </div>
        <div className={`nav-item ${activePath === "/favorites" ? "active" : ""}`} onClick={() => navigate("/favorites")}>
          <Heart size={24} />
          <span>Favoritos</span>
        </div>
        <div className={`nav-item ${activePath === "/store" ? "active" : ""}`} onClick={() => (isLogged ? navigate("/store") : openAuth("Regístrate o inicia sesión para acceder a tu tienda."))}>
          <StoreIcon size={24} />
          <span>Tienda</span>
        </div>
      </nav>
      {showAuth ? (
        <div className="login-screen" onClick={closeAuth}>
          <div className="login-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="icon-btn" type="button" onClick={closeAuth}>
                <X size={18} />
              </button>
            </div>
            <h1>MAQUETI</h1>
            <p>Tu marketplace inteligente</p>
            {authReason ? <div className="error">{authReason}</div> : null}
            <div className="google-btn-wrapper">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Error al iniciar sesión")} />
            </div>
            <button className="secondary-btn full" type="button" onClick={handlePasskeyLogin}>
              <Fingerprint size={18} /> Entrar con huella
            </button>
            <div className="muted" style={{ marginTop: "12px" }}>Origen: {typeof window !== "undefined" ? window.location.origin : ""}</div>
            <div className="muted">API: {getApiUrl()}</div>
            {error ? <div className="error">{error}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
