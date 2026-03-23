import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Home, Search, PlusSquare, Package, Store as StoreIcon, LogOut } from "lucide-react";

// Placeholder Views (will be separated later if needed, but keeping here for speed and simplicity first)
const HomeView = () => (
  <div className="view-container">
    <div className="search-bar">
      <Search size={20} color="#666" />
      <input type="text" placeholder="Buscar productos..." />
    </div>
    <div className="banner">
      <h2>Ofertas de la semana</h2>
      <p>Hasta 50% de descuento</p>
    </div>
    <h3>Categorías</h3>
    <div className="categories">
      <div className="cat-chip">Electrónica</div>
      <div className="cat-chip">Ropa</div>
      <div className="cat-chip">Hogar</div>
    </div>
    <h3>Cerca de ti</h3>
    <div className="product-grid">
      <div className="product-card">
        <div className="product-img placeholder-img"></div>
        <div className="product-info">
          <h4>iPhone 13</h4>
          <p className="price">500 €</p>
        </div>
      </div>
      <div className="product-card">
        <div className="product-img placeholder-img"></div>
        <div className="product-info">
          <h4>Bicicleta</h4>
          <p className="price">120 €</p>
        </div>
      </div>
    </div>
  </div>
);

const ExploreView = () => (
  <div className="view-container">
    <h2>Explorar</h2>
    <div className="feed-list">
      <div className="feed-item">
        <div className="feed-img placeholder-img"></div>
        <div className="feed-details">
          <h4>MacBook Pro</h4>
          <span className="tag new">Como nuevo</span>
          <p className="price-large">900 €</p>
        </div>
      </div>
      <div className="feed-item">
        <div className="feed-img placeholder-img"></div>
        <div className="feed-details">
          <h4>Silla de oficina</h4>
          <span className="tag zone">En tu zona</span>
          <p className="price-large">45 €</p>
        </div>
      </div>
    </div>
  </div>
);

const StoreView = ({ onLogout, userEmail }) => (
  <div className="view-container">
    <div className="store-header">
      <div className="store-banner placeholder-img"></div>
      <div className="store-profile">
        <div className="store-avatar"></div>
        <div>
          <h2>Mi Tienda</h2>
          <p>{userEmail}</p>
        </div>
      </div>
    </div>
    <div className="store-stats">
      <div className="stat-box">
        <p>Ingresos</p>
        <h3>1,245 €</h3>
      </div>
      <div className="stat-box">
        <p>Ventas</p>
        <h3>24</h3>
      </div>
    </div>
    <div className="store-tabs">
      <span className="active">Productos</span>
      <span>Ofertas</span>
    </div>
    <div className="product-grid">
      <div className="product-card">
        <div className="product-img placeholder-img"></div>
        <div className="product-info">
          <h4>Auriculares</h4>
          <p className="price">50 €</p>
        </div>
      </div>
    </div>
    <button className="logout-btn" onClick={onLogout}>
      <LogOut size={20} /> Cerrar sesión
    </button>
  </div>
);

const InventoryView = () => (
  <div className="view-container">
    <h2>Inventario</h2>
    <div className="inventory-metrics">
      <div className="metric"><span>Total</span><strong>12</strong></div>
      <div className="metric alert"><span>Bajo</span><strong>2</strong></div>
    </div>
    <div className="inventory-list">
      <div className="inventory-item">
        <div className="inv-info">
          <h4>Auriculares Bluetooth</h4>
          <p>SKU: 001</p>
        </div>
        <div className="inv-status in-stock">En stock (5)</div>
      </div>
      <div className="inventory-item">
        <div className="inv-info">
          <h4>Teclado Mecánico</h4>
          <p>SKU: 002</p>
        </div>
        <div className="inv-status out-stock">Agotado (0)</div>
      </div>
    </div>
  </div>
);

const AddProductView = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "https://maqueti.onrender.com";
      const response = await fetch(`${apiUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, price: Number(price), stock: Number(stock) }),
      });
      const data = await response.json();
      setMessage(data.message || "Producto creado");
      setTitle(""); setPrice(""); setStock("");
    } catch (error) {
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
        <input type="text" placeholder="Título del producto" value={title} onChange={e => setTitle(e.target.value)} required />
        <input type="number" placeholder="Precio (€)" value={price} onChange={e => setPrice(e.target.value)} required />
        <div className="row-inputs">
          <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} />
          <input type="text" placeholder="SKU (Opcional)" />
        </div>
        <button type="submit" className="primary-btn">Publicar</button>
      </form>
      {message && <p className="msg">{message}</p>}
    </div>
  );
};

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedEmail = localStorage.getItem("userEmail");
    if (token) {
      setIsLogged(true);
      setUserEmail(savedEmail || "");
    }
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://maqueti.onrender.com";
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        setIsLogged(true);
        setUserEmail(data.user.email);
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setIsLogged(false);
    setUserEmail("");
  };

  if (!isLogged) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>MAQUETI</h1>
          <p>Tu marketplace inteligente</p>
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log("Login Failed")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/explore" element={<ExploreView />} />
          <Route path="/add" element={<AddProductView />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="/store" element={<StoreView onLogout={handleLogout} userEmail={userEmail} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/")}>
          <Home size={24} />
          <span>Inicio</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/explore")}>
          <Search size={24} />
          <span>Explorar</span>
        </div>
        <div className="nav-item add-btn" onClick={() => navigate("/add")}>
          <div className="add-circle">
            <PlusSquare size={24} color="white" />
          </div>
        </div>
        <div className="nav-item" onClick={() => navigate("/inventory")}>
          <Package size={24} />
          <span>Stock</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/store")}>
          <StoreIcon size={24} />
          <span>Tienda</span>
        </div>
      </nav>
    </div>
  );
}

export default App;