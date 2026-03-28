import React from "react";
import { useNavigate } from "react-router-dom";
import { Fingerprint, LogOut, Store as StoreIcon } from "lucide-react";

export default function ProfilePage({ user, myProducts, onLogout, onRegisterPasskey, passkeyMessage }) {
  const navigate = useNavigate();

  return (
    <div className="view-container">
      <h2>Perfil</h2>

      <div className="empty-state" style={{ textAlign: "left" }}>
        <h4 style={{ marginBottom: 6 }}>{user?.name || "Usuario"}</h4>
        <p style={{ margin: 0 }}>{user?.email || ""}</p>
      </div>

      <div className="store-stats">
        <div className="stat-box">
          <p>Publicados</p>
          <h3>{Array.isArray(myProducts) ? myProducts.length : 0}</h3>
        </div>
        <div className="stat-box">
          <p>Plan tienda</p>
          <h3>{user?.storeSubscriptionStatus === "active" ? "Activo" : "Free"}</h3>
        </div>
      </div>

      <div className="btn-row">
        <button className="secondary-btn" type="button" onClick={() => navigate("/store")}>
          <StoreIcon size={18} /> Mi Tienda
        </button>
        <button className="secondary-btn" type="button" onClick={onRegisterPasskey}>
          <Fingerprint size={18} /> Activar huella
        </button>
        <button className="logout-btn" type="button" onClick={onLogout}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>

      {passkeyMessage ? <div className="msg">{passkeyMessage}</div> : null}
    </div>
  );
}

