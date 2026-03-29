import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-badge">M</div>
          <div>
            <div className="admin-brand-title">MAQUETI</div>
            <div className="admin-brand-subtitle">Panel Admin</div>
          </div>
        </div>
        <nav className="admin-nav">
          <button className="admin-nav-item active" type="button" onClick={() => navigate("/admin")}>
            Inicio
          </button>
          <button className="admin-nav-item" type="button" onClick={() => navigate("/admin/manage/users")}>
            Usuarios
          </button>
          <button className="admin-nav-item" type="button" onClick={() => navigate("/admin/manage/products")}>
            Productos
          </button>
          <button className="admin-nav-item" type="button" onClick={() => navigate("/admin/manage/stores")}>
            Tiendas
          </button>
          <button className="admin-nav-item" type="button" onClick={() => navigate("/admin/manage/chats")}>
            Chats
          </button>
          <button className="admin-nav-item" type="button" onClick={() => navigate("/admin/manage/ads")}>
            Publicidad
          </button>
          <button className="admin-nav-item" type="button" onClick={() => navigate("/admin/settings-audit")}>
            Configuración y Auditoría
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-page-title">Inicio</div>
            <div className="admin-page-subtitle">{user?.email || ""}</div>
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

        <section className="admin-card-grid">
          <div className="admin-card">
            <div className="admin-card-kicker">Módulo</div>
            <div className="admin-card-title">Usuarios</div>
            <button className="admin-card-btn" type="button" onClick={() => navigate("/admin/manage/users")}>
              Gestionar
            </button>
          </div>
          <div className="admin-card">
            <div className="admin-card-kicker">Módulo</div>
            <div className="admin-card-title">Productos</div>
            <div className="admin-muted">No disponible (falta API admin)</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-kicker">Módulo</div>
            <div className="admin-card-title">Tiendas</div>
            <div className="admin-muted">No disponible (falta API admin)</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-kicker">Módulo</div>
            <div className="admin-card-title">Chats</div>
            <div className="admin-muted">No disponible (falta API admin)</div>
          </div>
        </section>
      </main>
    </div>
  );
}
