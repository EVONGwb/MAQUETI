import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminShell({ active, user, onLogout, title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand" onClick={() => navigate("/admin")} role="button" tabIndex={0}>
          <div className="admin-badge">M</div>
          <div>
            <div className="admin-brand-title">MAQUETI</div>
            <div className="admin-brand-subtitle">Panel Admin</div>
          </div>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${active === "home" ? "active" : ""}`} type="button" onClick={() => navigate("/admin")}>
            Inicio
          </button>
          <button className={`admin-nav-item ${active === "users" ? "active" : ""}`} type="button" onClick={() => navigate("/admin/manage/users")}>
            Usuarios
          </button>
          <button className={`admin-nav-item ${active === "products" ? "active" : ""}`} type="button" onClick={() => navigate("/admin/manage/products")}>
            Productos
          </button>
          <button className={`admin-nav-item ${active === "stores" ? "active" : ""}`} type="button" onClick={() => navigate("/admin/manage/stores")}>
            Tiendas
          </button>
          <button className={`admin-nav-item ${active === "chats" ? "active" : ""}`} type="button" onClick={() => navigate("/admin/manage/chats")}>
            Chats
          </button>
          <button className={`admin-nav-item ${active === "ads" ? "active" : ""}`} type="button" onClick={() => navigate("/admin/manage/ads")}>
            Publicidad
          </button>
          <button className={`admin-nav-item ${active === "settings" ? "active" : ""}`} type="button" onClick={() => navigate("/admin/settings-audit")}>
            Configuración y Auditoría
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-page-title">{title}</div>
            <div className="admin-page-subtitle">{subtitle || user?.email || ""}</div>
          </div>
          <div className="admin-topbar-actions">
            <button className="secondary-btn" type="button" onClick={() => navigate("/")}>
              Volver a la app
            </button>
            <button className="logout-btn" type="button" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
