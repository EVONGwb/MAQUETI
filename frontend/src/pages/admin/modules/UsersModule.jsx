import React, { useEffect, useMemo, useState } from "react";
import { adminFetchUsers, adminUpdateUser, adminUpdateUserStoreAccess } from "../../../services/api.js";

const toDateTimeLocal = (ms) => {
  if (!ms) return "";
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDateTimeLocal = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export default function UsersModule({ token }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [isAdminFilter, setIsAdminFilter] = useState("");

  const [storePaymentsUnlocked, setStorePaymentsUnlocked] = useState(false);
  const [storeSubscriptionStatus, setStoreSubscriptionStatus] = useState("none");
  const [storePlan, setStorePlan] = useState("");
  const [storeSubscriptionEndsAt, setStoreSubscriptionEndsAt] = useState("");
  const [accountStatus, setAccountStatus] = useState("active");
  const [isAdminValue, setIsAdminValue] = useState(false);

  const selected = useMemo(() => users.find((u) => String(u.id) === String(selectedId)) || null, [users, selectedId]);

  const load = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminFetchUsers(token, {
        q: q || undefined,
        status: userStatus || undefined,
        isAdmin: isAdminFilter === "" ? undefined : isAdminFilter === "true",
      });
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!detail || !selected || String(detail.id) !== String(selected.id)) {
      setDetail(null);
      setStorePaymentsUnlocked(false);
      setStoreSubscriptionStatus("none");
      setStorePlan("");
      setStoreSubscriptionEndsAt("");
      return;
    }
    setStorePaymentsUnlocked(Boolean(detail.storePaymentsUnlocked));
    setStoreSubscriptionStatus(detail.storeSubscriptionStatus || "none");
    setStorePlan(detail.storePlan || "");
    setStoreSubscriptionEndsAt(toDateTimeLocal(detail.storeSubscriptionEndsAt));
    setAccountStatus(detail.status || "active");
    setIsAdminValue(Boolean(detail.isAdmin));
  }, [detail, selected]);

  const pickUser = (u) => {
    setSelectedId(u.id);
    setDetail(u);
    setStorePaymentsUnlocked(false);
    setStoreSubscriptionStatus("none");
    setStorePlan("");
    setStoreSubscriptionEndsAt("");
    setAccountStatus(u.status || "active");
    setIsAdminValue(Boolean(u.isAdmin));
  };

  const saveStoreAccess = async () => {
    if (!selected) return;
    if (!token) {
      setError("Token requerido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        storePaymentsUnlocked,
        storeSubscriptionStatus,
        storePlan: storePlan ? String(storePlan) : null,
        storeSubscriptionEndsAt: fromDateTimeLocal(storeSubscriptionEndsAt),
      };
      const res = await adminUpdateUserStoreAccess(selected.id, token, payload);
      const updated = res?.user || null;
      setDetail(updated);
      if (updated) {
        setUsers((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? { ...x, ...updated } : x)));
      }
    } catch (e) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async () => {
    if (!selected) return;
    if (!token) {
      setError("Token requerido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await adminUpdateUser(selected.id, token, {
        status: accountStatus,
        isAdmin: isAdminValue,
      });
      const updated = res?.user || null;
      setDetail(updated);
      if (updated) setUsers((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? { ...x, ...updated } : x)));
    } catch (e) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-split">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Usuarios</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (email/nombre)" style={{ height: 44, borderRadius: 12, padding: "0 12px" }} />
            <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">status: todos</option>
              <option value="active">active</option>
              <option value="blocked">blocked</option>
              <option value="disabled">disabled</option>
            </select>
            <select value={isAdminFilter} onChange={(e) => setIsAdminFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">admin: todos</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
            <button className="secondary-btn" type="button" disabled={loading || !token} onClick={load}>
              Recargar
            </button>
          </div>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {loading ? <div className="admin-muted">Cargando…</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={String(selectedId) === String(u.id) ? "active" : ""} onClick={() => pickUser(u)}>
                  <td>{u.id}</td>
                  <td>{u.name || "—"}</td>
                  <td>{u.email || "—"}</td>
                </tr>
              ))}
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="admin-muted">
                    No hay usuarios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Acceso Tienda</div>
        </div>

        {!selected ? (
          <div className="admin-muted">Selecciona un usuario para editar.</div>
        ) : (
          <div className="admin-form">
            <div className="admin-field">
              <div className="admin-label">Usuario</div>
              <div className="admin-value">{selected.email || selected.id}</div>
            </div>

            <label className="admin-check">
              <input type="checkbox" checked={storePaymentsUnlocked} onChange={(e) => setStorePaymentsUnlocked(e.target.checked)} />
              <span>Pagos desbloqueados</span>
            </label>

            <div className="admin-field">
              <div className="admin-label">Estado suscripción</div>
              <select value={storeSubscriptionStatus} onChange={(e) => setStoreSubscriptionStatus(e.target.value)}>
                <option value="none">none</option>
                <option value="active">active</option>
                <option value="canceled">canceled</option>
              </select>
            </div>

            <div className="admin-field">
              <div className="admin-label">Plan</div>
              <input value={storePlan} onChange={(e) => setStorePlan(e.target.value)} placeholder="Ej: pro" />
            </div>

            <div className="admin-field">
              <div className="admin-label">Fin suscripción</div>
              <input type="datetime-local" value={storeSubscriptionEndsAt} onChange={(e) => setStoreSubscriptionEndsAt(e.target.value)} />
            </div>

            <button className="primary-btn" type="button" disabled={saving} onClick={saveStoreAccess}>
              {saving ? "Guardando…" : "Guardar acceso tienda"}
            </button>
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Cuenta</div>
        </div>

        {!selected ? (
          <div className="admin-muted">Selecciona un usuario para editar.</div>
        ) : (
          <div className="admin-form">
            <div className="admin-field">
              <div className="admin-label">Estado</div>
              <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)}>
                <option value="active">active</option>
                <option value="blocked">blocked</option>
                <option value="disabled">disabled</option>
              </select>
            </div>

            <label className="admin-check">
              <input type="checkbox" checked={isAdminValue} onChange={(e) => setIsAdminValue(e.target.checked)} />
              <span>Administrador</span>
            </label>

            <button className="primary-btn" type="button" disabled={saving} onClick={saveAccount}>
              {saving ? "Guardando…" : "Guardar cuenta"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
