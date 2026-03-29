import React, { useEffect, useMemo, useState } from "react";
import AdminShell from "./AdminShell.jsx";
import { adminFetchAudit, adminGetSettings, adminPatchSettings } from "../../services/api.js";

const fmtDate = (ms) => {
  const n = Number(ms);
  if (!Number.isFinite(n) || !n) return "—";
  return new Date(n).toLocaleString();
};

const safeJsonParse = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return null;
  return JSON.parse(raw);
};

export default function AdminSettingsAudit({ token, user, onLogout }) {
  const [tab, setTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState([]);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");

  const [audit, setAudit] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ actorUserId: "", action: "", entityType: "" });

  const settingsMap = useMemo(() => {
    const m = new Map();
    for (const s of settings) m.set(String(s.key), s);
    return m;
  }, [settings]);

  const loadSettings = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminGetSettings(token);
      setSettings(Array.isArray(data?.settings) ? data.settings : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar settings");
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminFetchAudit(token, {
        actorUserId: auditFilters.actorUserId || undefined,
        action: auditFilters.action || undefined,
        entityType: auditFilters.entityType || undefined,
      });
      setAudit(Array.isArray(data?.events) ? data.events : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar auditoría");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "settings") loadSettings();
    if (tab === "audit") loadAudit();
  }, [tab]);

  const startEdit = (k) => {
    const v = settingsMap.get(String(k))?.value;
    setEditKey(String(k));
    setEditValue(v === undefined ? "" : JSON.stringify(v, null, 2));
  };

  const saveOne = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    const key = String(editKey || "").trim();
    if (!key) return;
    setSaving(true);
    setError("");
    try {
      const value = safeJsonParse(editValue);
      const res = await adminPatchSettings(token, { key, value });
      const updated = Array.isArray(res?.settings) ? res.settings[0] : null;
      if (updated) {
        setSettings((prev) => {
          const next = prev.filter((s) => String(s.key) !== String(updated.key));
          return [...next, updated].sort((a, b) => String(a.key).localeCompare(String(b.key)));
        });
      }
      setEditKey("");
      setEditValue("");
    } catch (e) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell active="settings" user={user} onLogout={onLogout} title="Configuración y Auditoría">
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button className={`admin-nav-item ${tab === "settings" ? "active" : ""}`} type="button" onClick={() => setTab("settings")}>
          Flags / Opciones
        </button>
        <button className={`admin-nav-item ${tab === "audit" ? "active" : ""}`} type="button" onClick={() => setTab("audit")}>
          Auditoría
        </button>
      </div>

      {error ? <div className="admin-error">{error}</div> : null}
      {loading ? <div className="admin-muted">Cargando…</div> : null}

      {tab === "settings" ? (
        <div className="admin-split">
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div className="admin-panel-title">Settings</div>
              <button className="secondary-btn" type="button" onClick={loadSettings} disabled={!token || loading}>
                Recargar
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {settings
                    .slice()
                    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
                    .map((s) => (
                      <tr key={s.key}>
                        <td>{s.key}</td>
                        <td>{fmtDate(s.updatedAt)}</td>
                        <td>
                          <button className="secondary-btn" type="button" onClick={() => startEdit(s.key)}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  {!loading && settings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="admin-muted">
                        No hay settings.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div className="admin-panel-title">Editar</div>
            </div>
            {!editKey ? (
              <div className="admin-muted">Selecciona un key.</div>
            ) : (
              <div className="admin-form">
                <div className="admin-field">
                  <div className="admin-label">Key</div>
                  <input value={editKey} disabled />
                </div>
                <div className="admin-field">
                  <div className="admin-label">Value (JSON)</div>
                  <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ minHeight: 220 }} />
                </div>
                <button className="primary-btn" type="button" disabled={saving} onClick={saveOne}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === "audit" ? (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div className="admin-panel-title">Eventos</div>
            <button className="secondary-btn" type="button" onClick={loadAudit} disabled={!token || loading}>
              Recargar
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input value={auditFilters.actorUserId} onChange={(e) => setAuditFilters((f) => ({ ...f, actorUserId: e.target.value }))} placeholder="actorUserId" style={{ height: 44, borderRadius: 12, padding: "0 12px" }} />
            <input value={auditFilters.action} onChange={(e) => setAuditFilters((f) => ({ ...f, action: e.target.value }))} placeholder="action" style={{ height: 44, borderRadius: 12, padding: "0 12px" }} />
            <input value={auditFilters.entityType} onChange={(e) => setAuditFilters((f) => ({ ...f, entityType: e.target.value }))} placeholder="entityType" style={{ height: 44, borderRadius: 12, padding: "0 12px" }} />
            <button className="primary-btn" type="button" onClick={loadAudit} disabled={!token || loading}>
              Buscar
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Actor</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.createdAt)}</td>
                    <td>{e.actorUserId}</td>
                    <td>{e.action}</td>
                    <td>{e.entityType}</td>
                    <td>{e.entityId || "—"}</td>
                  </tr>
                ))}
                {!loading && audit.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-muted">
                      Sin eventos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
