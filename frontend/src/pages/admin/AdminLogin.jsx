import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminLogin({ isLogged, user, openAuth }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  const redirect = params.get("redirect") || "/admin";
  const isAdmin = Boolean(user?.isAdmin);

  useEffect(() => {
    try {
      sessionStorage.setItem("maqueti_auth_redirect", redirect);
    } catch {
      undefined;
    }
    if (!isLogged) openAuth?.("Acceso Admin: inicia sesión con una cuenta administradora.");
  }, [isLogged, openAuth]);

  if (isLogged && isAdmin) return <Navigate to={redirect} replace />;

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h2>Admin</h2>
        <p>Inicia sesión para administrar la plataforma.</p>
        <button className="primary-btn" type="button" onClick={() => openAuth?.("Acceso Admin: inicia sesión con una cuenta administradora.")}>
          Iniciar sesión
        </button>
        {isLogged && !isAdmin ? <div className="admin-denied">Acceso admin requerido.</div> : null}
      </div>
    </div>
  );
}
