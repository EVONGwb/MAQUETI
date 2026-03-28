import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageCircle, Plus, Search, User } from "lucide-react";

export default function BottomNav({ isLogged, openAuth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${activePath === "/" ? "active" : ""}`} type="button" onClick={() => navigate("/")}>
        <Home size={22} />
        <span>Inicio</span>
      </button>

      <button className={`nav-item ${activePath === "/explore" ? "active" : ""}`} type="button" onClick={() => navigate("/explore")}>
        <Search size={22} />
        <span>Explorar</span>
      </button>

      <button
        className="nav-item nav-fab"
        type="button"
        aria-label="Publicar"
        onClick={() => (isLogged ? navigate("/add") : openAuth("Regístrate o inicia sesión para publicar productos."))}
      >
        <div className="nav-fab-circle">
          <Plus size={22} />
        </div>
      </button>

      <button className={`nav-item ${activePath.startsWith("/chats") ? "active" : ""}`} type="button" onClick={() => (isLogged ? navigate("/chats") : openAuth("Regístrate o inicia sesión para chatear."))}>
        <MessageCircle size={22} />
        <span>Chat</span>
      </button>

      <button className={`nav-item ${activePath === "/profile" ? "active" : ""}`} type="button" onClick={() => (isLogged ? navigate("/profile") : openAuth("Regístrate o inicia sesión para acceder a tu perfil."))}>
        <User size={22} />
        <span>Perfil</span>
      </button>
    </nav>
  );
}
