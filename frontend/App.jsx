import React, { useEffect, useMemo, useState, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Home, Search, PlusSquare, User, Package, Store as StoreIcon, LogOut, Fingerprint, RefreshCcw, ChevronLeft, ChevronRight, Star, Heart, MessageCircle, Send, Image as ImageIcon, X } from "lucide-react";
import HomePage from "./src/pages/Home";
import HomeUnicornReal from "./src/pages/HomeUnicornReal";
import ProductDetailPage from "./src/pages/ProductDetail";
import { ChatListPage, ChatDetailPage } from "./src/pages/ChatPage";
import BottomNav from "./src/components/BottomNav";
import AuthPrompt from "./src/components/AuthPrompt";
import InstallPrompt from "./src/components/InstallPrompt";
import StoreHub from "./src/pages/StoreHub";
import PublicStorePage from "./src/pages/PublicStore";
import ProfilePage from "./src/pages/Profile";
import PromoteProductPage from "./src/pages/PromoteProduct";
import AdminLogin from "./src/pages/admin/AdminLogin";
import AdminDashboard from "./src/pages/admin/AdminDashboard";
import AdminManage from "./src/pages/admin/AdminManage";
import AdminSettingsAudit from "./src/pages/admin/AdminSettingsAudit";
import GlobalSearchHeader from "./src/components/GlobalSearchHeader";
import { fetchPromotedProducts, getApiUrl, parseJsonResponse, resolveImageSrc } from "./src/services/api";
import { priceLabel } from "./src/services/format";

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

const HomeView = ({ products, search, setSearch, categories, activeCategory, setActiveCategory, loading, error, toggleFavorite = () => {}, favorites = [] }) => {
  const navigate = useNavigate();
  const filtered = useMemo(() => {
    const byCategory = activeCategory ? products.filter((p) => (p.category || "Otros") === activeCategory) : products;
    if (!search) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((p) => String(p.title || "").toLowerCase().includes(q) || String(p.location || "").toLowerCase().includes(q));
  }, [products, search, activeCategory]);

  const featuredProducts = useMemo(() => filtered.slice(0, 4), [filtered]); // For now, we just take the first 4 as featured

  const resolveImageSrc = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/300";
    if (typeof imageUrl !== "string") return "https://via.placeholder.com/300";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${getApiUrl()}${imageUrl}`;
  };
  
  // Custom categories mapping with icons
  const categoriesData = useMemo(() => {
    const iconMap = {
      "Electrónica": "📱",
      "Moda": "👕",
      "Gaming": "🎮",
      "Hogar": "🏠",
      "Motor": "🚗",
      "Deporte": "⚽",
      "Belleza": "💄",
      "Coleccionismo": "🧩",
      "Otros": "📦"
    };
    return categories.map(c => ({ name: c, icon: iconMap[c] || "✨" }));
  }, [categories]);

  const storesData = [
    { id: 1, name: "Tech Urban", tag: "Tecnología", rating: 4.9, products: 124, avatar: "TU" },
    { id: 2, name: "Moda Street", tag: "Ropa urbana", rating: 4.8, products: 86, avatar: "MS" },
    { id: 3, name: "Game Zone", tag: "Gaming", rating: 4.7, products: 59, avatar: "GZ" },
  ];

  return (
    <div className="mq-home">
      <header className="mq-topbar">
        <div className="mq-brand-wrap">
          <div className="mq-brand-badge">M</div>
          <div>
            <p className="mq-brand-subtitle">Marketplace urbano</p>
            <h1 className="mq-brand-title">MAQUETI</h1>
          </div>
        </div>

        <div className="mq-top-actions">
          <button className="mq-icon-btn" aria-label="Notificaciones" onClick={() => navigate("/notifications")}>🔔</button>
          <button className="mq-icon-btn" aria-label="Mensajes" onClick={() => navigate("/chats")}>💬</button>
        </div>
      </header>

      <main className="mq-main">
        <section className="mq-hero">
          <div className="mq-hero-content">
            <span className="mq-pill">Compra, vende y crea tu tienda</span>
            <h2>Todo lo que buscas en un solo lugar</h2>
            <p>Descubre productos, negocia por chat y gestiona tu tienda con una experiencia rápida y moderna.</p>

            <div className="mq-search">
              <span className="mq-search-icon">🔎</span>
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="mq-search-btn">Buscar</button>
            </div>

            <div className="mq-hero-stats">
              <div className="mq-stat-card">
                <strong>{products.length}+</strong>
                <span>Productos</span>
              </div>
              <div className="mq-stat-card">
                <strong>1.8K</strong>
                <span>Tiendas</span>
              </div>
              <div className="mq-stat-card">
                <strong>24/7</strong>
                <span>Chat activo</span>
              </div>
            </div>
          </div>

          <div className="mq-hero-side">
            <div className="mq-highlight-card mq-highlight-primary">
              <span className="mq-highlight-label">Tendencia</span>
              <h3>Electrónica premium</h3>
              <p>Productos destacados con envío rápido y vendedores verificados.</p>
            </div>

            <div className="mq-highlight-card">
              <span className="mq-highlight-label">Nuevo</span>
              <h3>Tiendas con stock</h3>
              <p>Controla catálogo, inventario y publicaciones desde una sola app.</p>
            </div>
          </div>
        </section>

        <section className="mq-section">
          <div className="mq-section-head">
            <div>
              <p className="mq-section-kicker">Explora</p>
              <h3>Categorías populares</h3>
            </div>
          </div>

          <div className="mq-categories-row">
            <button
              className={`mq-category-chip ${activeCategory === "" ? "active" : ""}`}
              onClick={() => setActiveCategory("")}
            >
              <span>✨</span> Todas
            </button>
            {categoriesData.map((category) => (
              <button
                key={category.name}
                className={`mq-category-chip ${activeCategory === category.name ? "active" : ""}`}
                onClick={() => setActiveCategory(category.name)}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="mq-section">
          <div className="mq-section-head">
            <div>
              <p className="mq-section-kicker">Destacado</p>
              <h3>Tiendas recomendadas</h3>
            </div>
            <button className="mq-link-btn">Ver todas</button>
          </div>

          <div className="mq-stores-grid">
            {storesData.map((store) => (
              <article key={store.id} className="mq-store-card">
                <div className="mq-store-top">
                  <div className="mq-store-avatar">{store.avatar}</div>
                  <div>
                    <h4>{store.name}</h4>
                    <p>{store.tag}</p>
                  </div>
                </div>

                <div className="mq-store-meta">
                  <span>⭐ {store.rating}</span>
                  <span>{store.products} productos</span>
                </div>

                <button className="mq-store-btn">Visitar tienda</button>
              </article>
            ))}
          </div>
        </section>

        {!!featuredProducts.length && (
          <section className="mq-section">
            <div className="mq-section-head">
              <div>
                <p className="mq-section-kicker">Selección</p>
                <h3>Productos destacados</h3>
              </div>
              <button className="mq-link-btn" onClick={() => navigate("/explore")}>Ver más</button>
            </div>

            <div className="mq-featured-row">
              {featuredProducts.map((product) => (
                <article key={product.id} className="mq-featured-card" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                  <div className="mq-featured-overlay">
                    <span className="mq-badge">{product.condition || "Nuevo"}</span>
                    <button
                      className={`mq-fav-btn ${favorites.includes(product.id) ? "active" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      aria-label="Guardar producto"
                    >
                      {favorites.includes(product.id) ? "❤" : "♡"}
                    </button>
                  </div>
                  <div className="mq-featured-info">
                    <p className="mq-product-category">{product.category || "Otros"}</p>
                    <h4>{product.title}</h4>
                    <strong>{priceLabel(product.price)}</strong>
                    <span>{product.location || "Online"}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mq-section mq-last-section">
          <div className="mq-section-head">
            <div>
              <p className="mq-section-kicker">Marketplace</p>
              <h3>Productos para ti</h3>
            </div>
            <button className="mq-filter-btn" onClick={() => navigate("/explore")}>Filtros</button>
          </div>

          {loading ? (
            <div className="mq-products-grid">
              {[1, 2, 3, 4].map(n => <div key={n} className="skeleton skeleton-card" style={{height: '250px', borderRadius: '16px'}}></div>)}
            </div>
          ) : !loading && error && products.length === 0 ? (
            <div className="mq-empty-state">
              <h4>Error al cargar productos</h4>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mq-empty-state">
              <h4>No encontramos productos</h4>
              <p>Prueba con otra búsqueda o selecciona otra categoría.</p>
            </div>
          ) : (
            <div className="mq-products-grid">
              {filtered.map((product) => (
                <article key={product.id} className="mq-product-card" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="mq-product-image-wrap">
                    <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                    <span className="mq-badge">{product.condition || "Nuevo"}</span>
                    <button
                      className={`mq-fav-btn small ${favorites.includes(product.id) ? "active" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      aria-label="Guardar producto"
                    >
                      {favorites.includes(product.id) ? "❤" : "♡"}
                    </button>
                  </div>

                  <div className="mq-product-info">
                    <p className="mq-product-category">{product.category || "Otros"}</p>
                    <h4>{product.title}</h4>
                    <div className="mq-product-bottom">
                      <strong>{priceLabel(product.price)}</strong>
                      <span>{product.location || "Online"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const ExploreView = ({ products, search, setSearch, categories, activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();
  const [promoted, setPromoted] = useState([]);
  const [promotedLoading, setPromotedLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const placement = search ? "search" : activeCategory ? "category" : "";
    if (!placement) {
      setPromoted([]);
      return undefined;
    }
    const run = async () => {
      setPromotedLoading(true);
      try {
        const data = await fetchPromotedProducts({ placement, category: activeCategory || undefined, limit: 3 });
        const list = Array.isArray(data?.products) ? data.products : [];
        if (!cancelled) setPromoted(list);
      } catch {
        if (!cancelled) setPromoted([]);
      } finally {
        if (!cancelled) setPromotedLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [search, activeCategory]);

  const filtered = useMemo(() => {
    const byCategory = activeCategory ? products.filter((p) => (p.category || "Otros") === activeCategory) : products;
    if (!search) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((p) => String(p.title || "").toLowerCase().includes(q) || String(p.description || "").toLowerCase().includes(q));
  }, [products, search, activeCategory]);

  const combined = useMemo(() => {
    if (!promoted.length) return filtered;
    const ids = new Set(promoted.map((p) => String(p.id)));
    const rest = filtered.filter((p) => !ids.has(String(p.id)));
    return [...promoted, ...rest];
  }, [filtered, promoted]);

  return (
    <div className="view-container">
      <button className="explore-post-cta" type="button" onClick={() => navigate("/add")}>
        <span className="explore-post-cta-left">
          <span className="explore-post-cta-icon">＋</span>
          Publicar producto
        </span>
        <span className="explore-post-cta-right">Gratis</span>
      </button>

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
      {promotedLoading ? <div className="empty-state">Cargando destacados…</div> : null}
      {combined.length === 0 ? <div className="empty-state">No se encontraron productos con esos filtros.</div> : null}
      <div className="feed-list">
        {combined.map((p) => (
          <div key={p.id} className="feed-item" onClick={() => navigate(`/product/${p.id}`)} style={{cursor: 'pointer'}}>
            <div 
              className="feed-img placeholder-img"
              style={p.imageUrl ? { backgroundImage: `url(${resolveImageSrc(p.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            ></div>
            <div className="feed-details">
              <h4>{p.title}</h4>
              <div className="product-meta">
                {p.isPromoted ? <span className="tag zone">Promocionado</span> : null}
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
  const [subcategory, setSubcategory] = useState("");
  const [condition, setCondition] = useState("Como nuevo");
  const [customCondition, setCustomCondition] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [sku, setSku] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [touched, setTouched] = useState({ title: false, price: false });
  const navigate = useNavigate();

  const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
  const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages((prev) => {
      const next = [...prev];
      for (const file of files) {
        if (next.length >= 5) break;
        if (!file) continue;
        const preview = URL.createObjectURL(file);
        next.push({ file, preview });
      }
      return next;
    });

    e.target.value = "";
  };

  const removeImageAt = (index) => {
    setImages((prev) => {
      const next = prev.slice();
      const item = next[index];
      if (item?.preview) {
        try {
          URL.revokeObjectURL(item.preview);
        } catch {
          undefined;
        }
      }
      next.splice(index, 1);
      return next;
    });
  };

  const moveImage = (from, to) => {
    setImages((prev) => {
      if (from === to) return prev;
      if (from < 0 || from >= prev.length) return prev;
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const makePrimary = (index) => {
    setImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const removeAllImages = () => {
    setImages((prev) => {
      for (const item of prev) {
        if (item?.preview) {
          try {
            URL.revokeObjectURL(item.preview);
          } catch {
            undefined;
          }
        }
      }
      return [];
    });
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
    setLimitInfo(null);

    try {
      const cleanTitle = String(title || "").trim();
      const priceValue = Number(String(price || "").replace(",", "."));
      const finalCondition = condition === "Otro" ? String(customCondition || "").trim() : String(condition || "").trim();
      const finalLocation = city === "Otra" ? String(customCity || "").trim() : String(city || "").trim();

      if (cleanTitle.length < 3) throw new Error("Pon un título más claro (mínimo 3 caracteres).");
      if (!Number.isFinite(priceValue) || priceValue <= 0) throw new Error("Pon un precio válido.");
      if (!finalCondition) throw new Error("Selecciona una condición.");

      const filesToUpload = images.map((x) => x?.file).filter(Boolean).slice(0, 5);
      const uploadedUrls = [];
      for (const file of filesToUpload) {
        const url = await uploadImageToCloudinary(file);
        if (!url) throw new Error("No se pudo subir la imagen");
        uploadedUrls.push(url);
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: cleanTitle,
          price: priceValue,
          description: description || null,
          stock: stock === "" ? null : Number(stock),
          category,
          subcategory: subcategory || null,
          condition: finalCondition,
          location: finalLocation || null,
          sku: sku || null,
          imageUrl: uploadedUrls[0] || null,
          imageUrls: uploadedUrls.length ? uploadedUrls : null
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        if (data?.code === "PRODUCT_LIMIT_REACHED") {
          setLimitInfo({ limit: data?.limit || null });
        }
        throw new Error(data?.message);
      }
      
      setMessage(data.message || "Producto creado");
      setTitle("");
      setPrice("");
      setDescription("");
      setStock("");
      setCategory("Otros");
      setSubcategory("");
      setCondition("Como nuevo");
      setCustomCondition("");
      setCity("");
      setCustomCity("");
      setSku("");
      removeAllImages();
      await Promise.resolve(onCreated?.());
      navigate("/profile");
    } catch (err) {
      setMessage(err?.message || "Error al crear producto");
    } finally {
      setUploading(false);
    }
  };

  const conditionOptions = ["Nuevo", "Como nuevo", "Buen estado", "Aceptable", "Otro"];
  const titleMax = 70;
  const descMax = 650;
  const cleanTitle = String(title || "").trim();
  const cleanDescription = String(description || "");
  const catLabel = subcategory ? `${category} > ${subcategory}` : category;
  const previewImage = images[0]?.preview || "";
  const categories = [
    "Tecnología",
    "Moda",
    "Hogar",
    "Motor",
    "Gaming",
    "Deporte",
    "Belleza",
    "Coleccionismo",
    "Niños",
    "Mascotas",
    "Servicios",
    "Otros",
  ];
  const subcategoryMap = {
    Tecnología: ["Móviles", "Ordenadores", "Consolas", "Audio", "TV y vídeo", "Accesorios", "Wearables", "Componentes", "Otros"],
    Moda: ["Hombre", "Mujer", "Niños", "Zapatos", "Bolsos", "Relojes", "Accesorios", "Otros"],
    Hogar: ["Muebles", "Decoración", "Cocina", "Electrodomésticos", "Jardín", "Limpieza", "Iluminación", "Otros"],
    Motor: ["Coches", "Motos", "Recambios", "Accesorios", "Neumáticos", "Herramientas", "Otros"],
    Gaming: ["Consolas", "Juegos", "PC Gaming", "Mandos", "Accesorios", "Coleccionables", "Otros"],
    Deporte: ["Fitness", "Fútbol", "Running", "Ciclismo", "Outdoor", "Natación", "Otros"],
    Belleza: ["Perfumes", "Maquillaje", "Cuidado facial", "Cuidado capilar", "Cuidado corporal", "Otros"],
    Coleccionismo: ["Trading Cards", "Figuras", "Vintage", "Comics", "Arte", "Monedas", "Otros"],
    Niños: ["Ropa", "Juguetes", "Carritos", "Sillas", "Higiene", "Otros"],
    Mascotas: ["Accesorios", "Alimentación", "Higiene", "Transportines", "Otros"],
    Servicios: ["Reparaciones", "Mudanzas", "Clases", "Eventos", "Otros"],
    Otros: ["General"],
  };
  const subOptions = subcategoryMap[category] || [];
  const cities = ["Malabo", "Bata", "Ebebiyín", "Mongomo", "Evinayong", "Niefang", "Añisok", "Aconibe", "Micomiseng", "Mbini", "Kogo", "Luba", "Baney", "Riaba", "Otra"];
  const titleError = touched.title && String(title || "").trim().length < 3 ? "Mínimo 3 caracteres" : "";
  const priceValue = Number(String(price || "").replace(",", "."));
  const priceError = touched.price && (!Number.isFinite(priceValue) || priceValue <= 0) ? "Precio inválido" : "";
  const canSubmit = cleanTitle.length >= 3 && cleanTitle.length <= titleMax && Number.isFinite(priceValue) && priceValue > 0 && !uploading;

  return (
    <div className="view-container post-view">
      <div className="post-header">
        <div>
          <h2>Subir producto</h2>
          <div className="post-subtitle">Rápido, visual y listo para vender.</div>
        </div>
      </div>

      <div className="post-preview">
        <div className="post-preview-media" style={previewImage ? { backgroundImage: `url(${previewImage})` } : {}}>
          {!previewImage ? (
            <div className="post-preview-empty">
              <ImageIcon size={18} />
              Vista previa
            </div>
          ) : null}
        </div>
        <div className="post-preview-info">
          <div className="post-preview-title">{cleanTitle || "Título del producto"}</div>
          <div className="post-preview-meta">
            <span className="post-preview-price">{Number.isFinite(priceValue) && priceValue > 0 ? priceLabel(priceValue) : "€0"}</span>
            <span className="post-preview-dot">•</span>
            <span className="post-preview-cat">{catLabel || "Otros"}</span>
          </div>
        </div>
      </div>

      {limitInfo ? (
        <div className="post-limit">
          <div className="post-limit-title">Límite alcanzado</div>
          <div className="post-limit-text">
            Los usuarios normales pueden publicar hasta {limitInfo.limit || "X"} productos. Para publicar sin límite, activa el modo Tienda.
          </div>
          <button className="primary-btn" type="button" onClick={() => navigate("/store")}>
            Ir a Tienda
          </button>
        </div>
      ) : null}

      <form className="post-form" onSubmit={handleCreate}>
        <div className="post-card">
          <div className="post-card-head">
            <div className="post-card-title">{`Fotos (${images.length}/5)`}</div>
            {images.length ? (
              <button className="post-link" type="button" onClick={removeAllImages}>
                Quitar todas
              </button>
            ) : null}
          </div>

          <div className="post-photos">
            {images.map((img, idx) => (
              <div key={img.preview} className="post-photo-item" style={{ backgroundImage: `url(${img.preview})` }}>
                {idx === 0 ? <div className="post-photo-badge">Principal</div> : null}
                <button className="post-photo-remove" type="button" onClick={() => removeImageAt(idx)} aria-label="Quitar foto">
                  <X size={16} />
                </button>
                <div className="post-photo-actions">
                  <button className="post-photo-action-btn" type="button" onClick={() => makePrimary(idx)} aria-label="Hacer principal" disabled={idx === 0}>
                    <Star size={16} />
                  </button>
                  <button className="post-photo-action-btn" type="button" onClick={() => moveImage(idx, idx - 1)} aria-label="Mover a la izquierda" disabled={idx === 0}>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="post-photo-action-btn" type="button" onClick={() => moveImage(idx, idx + 1)} aria-label="Mover a la derecha" disabled={idx === images.length - 1}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}

            {images.length < 5 ? (
              <label className="post-photo-add">
                <span className="post-photo-add-inner">
                  <ImageIcon size={20} />
                  Añadir
                </span>
                <input type="file" multiple accept="image/*" capture="environment" onChange={handleImageChange} />
              </label>
            ) : null}
          </div>
          <div className="post-hint">Hasta 5 fotos</div>
        </div>

        <div className="post-card">
          <div className="post-card-title">Detalles</div>
          <div className="post-fields">
            <div className="post-field">
              <div className="post-label">
                Título <span className={`post-count ${cleanTitle.length > titleMax ? "bad" : ""}`}>{cleanTitle.length}/{titleMax}</span>
              </div>
              <input
                className="post-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                placeholder="Ej: iPhone 13 Pro 128GB"
                autoComplete="off"
              />
              {titleError || cleanTitle.length > titleMax ? (
                <div className="post-hint error">{titleError || `Máximo ${titleMax} caracteres`}</div>
              ) : (
                <div className="post-hint">Que sea corto y claro.</div>
              )}
            </div>

            <div className="post-grid2">
              <div className="post-field">
                <div className="post-label">Precio</div>
                <div className="post-money">
                  <span className="post-money-prefix">€</span>
                  <input
                    className="post-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, price: true }))}
                    placeholder="0"
                    inputMode="decimal"
                    autoComplete="off"
                  />
                </div>
                {priceError ? <div className="post-hint error">{priceError}</div> : <div className="post-hint">Pon un precio competitivo.</div>}
              </div>

              <div className="post-field">
                <div className="post-label">Condición</div>
                <div className="post-segment">
                  {conditionOptions.map((opt) => (
                    <button key={opt} className={`post-pill ${condition === opt ? "active" : ""}`} type="button" onClick={() => setCondition(opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
                {condition === "Otro" ? (
                  <input className="post-input" value={customCondition} onChange={(e) => setCustomCondition(e.target.value)} placeholder="Especifica la condición" />
                ) : null}
              </div>
            </div>

            <div className="post-grid2">
              <div className="post-field">
                <div className="post-label">Categoría</div>
                <select
                  className="post-input"
                  value={category}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCategory(next || "Otros");
                    setSubcategory("");
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select className="post-input" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} aria-label="Subcategoría">
                  <option value="">Sin subcategoría</option>
                  {subOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="post-field">
                <div className="post-label">Ubicación (Guinea Ecuatorial, opcional)</div>
                <select className="post-input" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Ciudad">
                  <option value="">Selecciona ciudad (opcional)</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {city === "Otra" ? (
                  <input className="post-input" value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="Escribe tu ciudad" autoComplete="off" />
                ) : null}
              </div>
            </div>

            <details className="post-advanced">
              <summary className="post-advanced-summary">Opciones avanzadas</summary>
              <div className="post-grid2">
                <div className="post-field">
                  <div className="post-label">Stock (opcional)</div>
                  <input className="post-input" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Ej: 3" inputMode="numeric" />
                </div>
                <div className="post-field">
                  <div className="post-label">SKU (opcional)</div>
                  <input className="post-input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ej: IP13-128" autoComplete="off" />
                </div>
              </div>
            </details>

            <div className="post-field">
              <div className="post-label">
                Descripción (opcional) <span className={`post-count ${cleanDescription.length > descMax ? "bad" : ""}`}>{cleanDescription.length}/{descMax}</span>
              </div>
              <textarea
                className="post-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Añade detalles, estado, entrega, etc."
              />
              {cleanDescription.length > descMax ? <div className="post-hint error">{`Máximo ${descMax} caracteres`}</div> : null}
            </div>
          </div>
        </div>

        <div className="post-footer">
          <button type="submit" className="primary-btn post-submit" disabled={!canSubmit}>
            {uploading ? "Publicando..." : "Publicar"}
          </button>
          {message ? <div className="post-msg">{message}</div> : null}
        </div>
      </form>
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
        try {
          const meRes = await fetch(`${getApiUrl()}/api/users/me`, {
            headers: { Authorization: `Bearer ${tkn}` },
          });
          const meData = await parseJsonResponse(meRes);
          if (meRes.ok && meData?.user) {
            setUser(meData.user);
            try {
              localStorage.setItem("userName", meData.user.name || "");
              localStorage.setItem("userIsAdmin", String(Boolean(meData.user.isAdmin)));
              localStorage.setItem("userStoreSubscriptionStatus", String(meData.user.storeSubscriptionStatus || "none"));
              localStorage.setItem("userStorePlan", meData.user.storePlan ? String(meData.user.storePlan) : "");
              localStorage.setItem("userStoreSubscriptionEndsAt", meData.user.storeSubscriptionEndsAt ? String(Number(meData.user.storeSubscriptionEndsAt)) : "");
              localStorage.setItem("userStorePaymentsUnlocked", String(Boolean(meData.user.storePaymentsUnlocked)));
              localStorage.setItem("userAvatarUrl", meData.user.avatarUrl ? String(meData.user.avatarUrl) : "");
              localStorage.setItem("userBannerUrl", meData.user.bannerUrl ? String(meData.user.bannerUrl) : "");
              localStorage.setItem("userThemeColor", meData.user.themeColor ? String(meData.user.themeColor) : "");
            } catch {
              undefined;
            }
          }
        } catch {
          undefined;
        }
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
    const storedIsAdmin = localStorage.getItem("userIsAdmin") || "";
    const storedStoreSubscriptionStatus = localStorage.getItem("userStoreSubscriptionStatus") || "";
    const storedStorePlan = localStorage.getItem("userStorePlan") || "";
    const storedStoreSubscriptionEndsAt = localStorage.getItem("userStoreSubscriptionEndsAt") || "";
    const storedStorePaymentsUnlocked = localStorage.getItem("userStorePaymentsUnlocked") || "";
    const storedAvatarUrl = localStorage.getItem("userAvatarUrl") || "";
    const storedBannerUrl = localStorage.getItem("userBannerUrl") || "";
    const storedThemeColor = localStorage.getItem("userThemeColor") || "";

    if (storedToken && !isJwtExpired(storedToken)) {
      setIsLogged(true);
      setToken(storedToken);
      const u = {
        id: storedId ? Number(storedId) : null,
        email: storedEmail,
        name: storedName,
        isAdmin: storedIsAdmin === "true",
        storeSubscriptionStatus: storedStoreSubscriptionStatus || "none",
        storePlan: storedStorePlan || null,
        storeSubscriptionEndsAt: storedStoreSubscriptionEndsAt ? Number(storedStoreSubscriptionEndsAt) : null,
        storePaymentsUnlocked: storedStorePaymentsUnlocked === "true",
        avatarUrl: storedAvatarUrl || null,
        bannerUrl: storedBannerUrl || null,
        themeColor: storedThemeColor || null,
      };
      setUser(u);
      refreshData(storedToken, u);
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userIsAdmin");
    localStorage.removeItem("userStoreSubscriptionStatus");
    localStorage.removeItem("userStorePlan");
    localStorage.removeItem("userStoreSubscriptionEndsAt");
    localStorage.removeItem("userStorePaymentsUnlocked");
    localStorage.removeItem("userAvatarUrl");
    localStorage.removeItem("userBannerUrl");
    localStorage.removeItem("userThemeColor");
    refreshData("", null);
  }, []);

  const onAuthSuccess = async (data) => {
    if (!data?.token || !data?.user) return;
    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userId", String(data.user.id));
    localStorage.setItem("userName", data.user.name || "");
    localStorage.setItem("userIsAdmin", String(Boolean(data.user.isAdmin)));
    localStorage.setItem("userStoreSubscriptionStatus", String(data.user.storeSubscriptionStatus || "none"));
    localStorage.setItem("userStorePlan", data.user.storePlan ? String(data.user.storePlan) : "");
    localStorage.setItem("userStoreSubscriptionEndsAt", data.user.storeSubscriptionEndsAt ? String(Number(data.user.storeSubscriptionEndsAt)) : "");
    localStorage.setItem("userStorePaymentsUnlocked", String(Boolean(data.user.storePaymentsUnlocked)));
    localStorage.setItem("userAvatarUrl", data.user.avatarUrl ? String(data.user.avatarUrl) : "");
    localStorage.setItem("userBannerUrl", data.user.bannerUrl ? String(data.user.bannerUrl) : "");
    localStorage.setItem("userThemeColor", data.user.themeColor ? String(data.user.themeColor) : "");
    setToken(data.token);
    setUser(data.user);
    setIsLogged(true);
    await refreshData(data.token, data.user);
    closeAuth();
    let redirectTo = "/";
    try {
      const v = sessionStorage.getItem("maqueti_auth_redirect");
      if (v) redirectTo = v;
      sessionStorage.removeItem("maqueti_auth_redirect");
    } catch {
      undefined;
    }
    navigate(redirectTo);
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

  const handlePasswordLogin = async ({ email, password }) => {
    setError("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error al iniciar sesión");
      await onAuthSuccess(data);
    } catch (e) {
      const msg = e?.message || "Error al iniciar sesión";
      setError(msg);
      throw e;
    }
  };

  const handlePasswordRegister = async ({ name, email, password }) => {
    setError("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error al registrarse");
      await onAuthSuccess(data);
    } catch (e) {
      const msg = e?.message || "Error al registrarse";
      setError(msg);
      throw e;
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
    localStorage.removeItem("userIsAdmin");
    localStorage.removeItem("userStoreSubscriptionStatus");
    localStorage.removeItem("userStorePlan");
    localStorage.removeItem("userStoreSubscriptionEndsAt");
    localStorage.removeItem("userStorePaymentsUnlocked");
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
  const isAdmin = Boolean(user?.isAdmin);
  const hideNav = activePath === "/login" || activePath.startsWith("/admin");
  
  // El GlobalSearchHeader solo se mostrará en las rutas donde queremos que sea "global"
  // y lo renderizaremos DESPUÉS del Header de la Home (o dentro de él) pero 
  // para simplificar y mantener la lógica de "debajo del nombre y logo",
  // vamos a ocultarlo en la vista global de App.jsx y lo moveremos al componente Home.jsx, 
  // O bien, podemos mantenerlo aquí pero ocultarlo en la ruta "/" para que Home lo renderice en su sitio.
  // Vamos a ocultarlo en Home ("/") para renderizarlo dentro del st-header de Home.jsx
  const showGlobalSearch = activePath !== "/"; 

  return (
    <div className="app-layout">
      {showGlobalSearch && (
        <GlobalSearchHeader
          search={search}
          setSearch={setSearch}
          categories={categories}
          setActiveCategory={setActiveCategory}
          products={products}
        />
      )}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<AdminLogin isLogged={isLogged} user={user} openAuth={openAuth} />} />
          <Route
            path="/admin"
            element={
              !isLogged ? (
                <Navigate to={`/login?redirect=${encodeURIComponent("/admin")}`} replace />
              ) : !isAdmin ? (
                <div className="view-container">
                  <h2>Acceso admin requerido</h2>
                  <div className="empty-state">Tu cuenta no tiene permisos de administrador.</div>
                </div>
              ) : (
                <AdminDashboard user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/admin/manage/:module"
            element={
              !isLogged ? (
                <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
              ) : !isAdmin ? (
                <div className="view-container">
                  <h2>Acceso admin requerido</h2>
                  <div className="empty-state">Tu cuenta no tiene permisos de administrador.</div>
                </div>
              ) : (
                <AdminManage token={token} user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/admin/settings-audit"
            element={
              !isLogged ? (
                <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
              ) : !isAdmin ? (
                <div className="view-container">
                  <h2>Acceso admin requerido</h2>
                  <div className="empty-state">Tu cuenta no tiene permisos de administrador.</div>
                </div>
              ) : (
                <AdminSettingsAudit token={token} user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route path="/" element={<HomePage products={products} search={search} setSearch={setSearch} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} loading={loading} error={error} toggleFavorite={toggleFavorite} favorites={favorites} token={token} onRequireAuth={() => openAuth("Regístrate o inicia sesión para chatear con el vendedor.")} />} />
          <Route path="/unicorn" element={<HomeUnicornReal products={products} search={search} setSearch={setSearch} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} loading={loading} error={error} toggleFavorite={toggleFavorite} favorites={favorites} token={token} onRequireAuth={() => openAuth("Regístrate o inicia sesión para chatear con el vendedor.")} />} />
          <Route path="/explore" element={<ExploreView products={products} search={search} setSearch={setSearch} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />} />
          <Route path="/shop/:slug" element={<PublicStorePage />} />
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
                <StoreHub token={token} user={user} myProducts={myProducts} refreshData={refreshData} onRequireAuth={(msg) => openAuth(msg)} />
              ) : (
                <AuthRequiredView title="Mi Tienda" message="Regístrate o inicia sesión para acceder a tu tienda." onLogin={() => openAuth("Regístrate o inicia sesión para acceder a tu tienda.")} />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isLogged ? (
                <ProfilePage user={user} myProducts={myProducts} token={token} refreshData={refreshData} onLogout={handleLogout} onRegisterPasskey={handleRegisterPasskey} passkeyMessage={passkeyMessage} />
              ) : (
                <AuthRequiredView title="Perfil" message="Regístrate o inicia sesión para acceder a tu perfil." onLogin={() => openAuth("Regístrate o inicia sesión para acceder a tu perfil.")} />
              )
            }
          />
          <Route
            path="/promote"
            element={
              isLogged ? (
                <PromoteProductPage token={token} myProducts={myProducts} />
              ) : (
                <AuthRequiredView title="Promocionar" message="Regístrate o inicia sesión para promocionar productos." onLogin={() => openAuth("Regístrate o inicia sesión para promocionar productos.")} />
              )
            }
          />
          <Route path="/product/:id" element={<ProductDetailPage products={products} toggleFavorite={toggleFavorite} favorites={favorites} onRequireAuth={() => openAuth("Regístrate o inicia sesión para chatear con el vendedor.")} />} />
          <Route
            path="/chats"
            element={
              isLogged ? <ChatListPage token={token} user={user} /> : <AuthRequiredView title="Mensajes" message="Regístrate o inicia sesión para ver tus chats." onLogin={() => openAuth("Regístrate o inicia sesión para ver tus chats.")} />
            }
          />
          <Route
            path="/chats/:id"
            element={
              isLogged ? <ChatDetailPage token={token} user={user} /> : <AuthRequiredView title="Mensajes" message="Regístrate o inicia sesión para abrir este chat." onLogin={() => openAuth("Regístrate o inicia sesión para abrir este chat.")} />
            }
          />
          <Route path="/favorites" element={<FavoritesView products={products} favorites={favorites} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <InstallPrompt />
      {hideNav ? null : <BottomNav isLogged={isLogged} openAuth={openAuth} />}
      <AuthPrompt
        open={showAuth}
        title="Necesitas una cuenta"
        message={authReason || "Regístrate para chatear, guardar favoritos y comprar"}
        error={error}
        onClose={closeAuth}
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={() => setError("Error al iniciar sesión")}
        onPasskey={handlePasskeyLogin}
        onEmailLogin={handlePasswordLogin}
        onEmailRegister={handlePasswordRegister}
      />
    </div>
  );
}

export default App;
