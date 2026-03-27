import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Home, MessageCircle, PlusSquare, Search, Store as StoreIcon } from "lucide-react";

export default function BottomNav({ isLogged, openAuth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  return (
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
  );
}
