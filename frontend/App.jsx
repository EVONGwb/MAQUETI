import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Home, Search, PlusSquare, Package, Store as StoreIcon, LogOut, Fingerprint, RefreshCcw } from "lucide-react";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") return "http://localhost:3005";
  return "https://maqueti.onrender.com";
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

const ProductCard = ({ product }) => (
  <div className="product-card">
    <div className="product-img placeholder-img"></div>
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

const HomeView = ({ products, search, setSearch, categories, activeCategory, setActiveCategory }) => {
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
      {filtered.length === 0 ? <div className="empty-state">No hay productos todavía.</div> : null}
      <div className="product-grid">
        {filtered.slice(0, 12).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

const ExploreView = ({ products }) => (
  <div className="view-container">
    <h2>Explorar</h2>
    {products.length === 0 ? <div className="empty-state">Aún no hay productos publicados.</div> : null}
    <div className="feed-list">
      {products.map((p) => (
        <div key={p.id} className="feed-item">
          <div className="feed-img placeholder-img"></div>
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
      {myProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
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
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Otros");
  const [condition, setCondition] = useState("Como nuevo");
  const [location, setLocation] = useState("");
  const [sku, setSku] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
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
          stock: stock === "" ? null : Number(stock),
          category,
          condition,
          location: location || null,
          sku: sku || null,
        }),
      });
      const data = await response.json();
      setMessage(data.message || "Producto creado");
      if (response.ok) {
        setTitle("");
        setPrice("");
        setStock("");
        setCategory("Otros");
        setCondition("Como nuevo");
        setLocation("");
        setSku("");
        onCreated();
      }
    } catch {
      setMessage("Error al crear producto");
    }
  };

  return (
    <div className="view-container">
      <h2>Subir Producto</h2>
      <form className="add-form" onSubmit={handleCreate}>
        <div className="image-upload">
          <span>+ Añadir fotos</span>
        </div>
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
        <button type="submit" className="primary-btn">Publicar</button>
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [passkeyMessage, setPasskeyMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Otros"));
    return Array.from(set).slice(0, 12);
  }, [products]);

  const fetchAllProducts = async (tkn) => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/products`, { headers: { Authorization: `Bearer ${tkn}` } });
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
      const all = await fetchAllProducts(tkn);
      setProducts(all);
      if (usr?.id) {
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
    setProducts([]);
    setMyProducts([]);
    setError("");
    setPasskeyMessage("");
    navigate("/");
  };

  const activePath = location.pathname;

  if (!isLogged) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>MAQUETI</h1>
          <p>Tu marketplace inteligente</p>

          <div className="google-btn-wrapper">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Error al iniciar sesión")} />
          </div>

          <button className="secondary-btn full" type="button" onClick={handlePasskeyLogin}>
            <Fingerprint size={18} /> Entrar con huella
          </button>

          {error ? <div className="error">{error}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="main-content">
        <div className="top-status">
          <div className="muted">{user?.email || ""}</div>
          <button className="icon-btn" type="button" onClick={() => refreshData(token, user)} disabled={loading}>
            <RefreshCcw size={18} />
          </button>
        </div>
        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="empty-state">Cargando...</div> : null}
        <Routes>
          <Route
            path="/"
            element={
              <HomeView
                products={products}
                search={search}
                setSearch={setSearch}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            }
          />
          <Route path="/explore" element={<ExploreView products={products} />} />
          <Route path="/add" element={<AddProductView token={token} onCreated={() => refreshData(token, user)} />} />
          <Route path="/inventory" element={<InventoryView myProducts={myProducts} />} />
          <Route
            path="/store"
            element={
              <StoreView
                user={user}
                myProducts={myProducts}
                onLogout={handleLogout}
                onRegisterPasskey={handleRegisterPasskey}
                passkeyMessage={passkeyMessage}
              />
            }
          />
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
        <div className="nav-item add-btn" onClick={() => navigate("/add")}>
          <div className="add-circle">
            <PlusSquare size={24} color="white" />
          </div>
        </div>
        <div className={`nav-item ${activePath === "/inventory" ? "active" : ""}`} onClick={() => navigate("/inventory")}>
          <Package size={24} />
          <span>Stock</span>
        </div>
        <div className={`nav-item ${activePath === "/store" ? "active" : ""}`} onClick={() => navigate("/store")}>
          <StoreIcon size={24} />
          <span>Tienda</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
