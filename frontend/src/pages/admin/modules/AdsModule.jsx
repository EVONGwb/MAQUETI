import React, { useEffect, useMemo, useState } from "react";
import { adminCreateAd, adminDeleteAd, adminFetchAds, adminUpdateAd } from "../../../services/api.js";

const safeJsonParse = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return null;
  return JSON.parse(raw);
};

export default function AdsModule({ token }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ads, setAds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => ads.find((a) => String(a.id) === String(selectedId)) || null, [ads, selectedId]);

  const [draft, setDraft] = useState({
    name: "",
    status: "draft",
    placement: "home",
    targetingJson: "",
    creativeJson: "",
  });

  const load = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminFetchAds(token, { status: statusFilter || undefined });
      setAds(Array.isArray(data?.ads) ? data.ads : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar publicidad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft({
      name: selected.name || "",
      status: selected.status || "draft",
      placement: selected.placement || "home",
      targetingJson: selected.targeting ? JSON.stringify(selected.targeting, null, 2) : "",
      creativeJson: selected.creative ? JSON.stringify(selected.creative, null, 2) : "",
    });
  }, [selectedId]);

  const create = async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: String(draft.name || "").trim(),
        status: draft.status,
        placement: draft.placement,
        targeting: safeJsonParse(draft.targetingJson),
        creative: safeJsonParse(draft.creativeJson),
      };
      const res = await adminCreateAd(token, payload);
      const created = res?.ad || null;
      if (created) {
        setAds((prev) => [created, ...prev]);
        setSelectedId(created.id);
      }
    } catch (e) {
      setError(e?.message || "No se pudo crear");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: String(draft.name || "").trim(),
        status: draft.status,
        placement: draft.placement,
        targeting: safeJsonParse(draft.targetingJson),
        creative: safeJsonParse(draft.creativeJson),
      };
      const res = await adminUpdateAd(selected.id, token, payload);
      const updated = res?.ad || null;
      if (updated) setAds((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
    } catch (e) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async () => {
    if (!selected) return;
    const ok = window.confirm("¿Eliminar esta campaña? Esta acción no se puede deshacer.");
    if (!ok) return;
    setSaving(true);
    setError("");
    try {
      await adminDeleteAd(selected.id, token);
      setAds((prev) => prev.filter((x) => String(x.id) !== String(selected.id)));
      setSelectedId(null);
    } catch (e) {
      setError(e?.message || "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-split">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Publicidad</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">status: todos</option>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="ended">ended</option>
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
                <th>Status</th>
                <th>Placement</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((a) => (
                <tr key={a.id} className={String(selectedId) === String(a.id) ? "active" : ""} onClick={() => setSelectedId(a.id)}>
                  <td>{a.id}</td>
                  <td>{a.name || "—"}</td>
                  <td>{a.status || "draft"}</td>
                  <td>{a.placement || "home"}</td>
                </tr>
              ))}
              {!loading && ads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-muted">
                    No hay campañas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">{selected ? "Editar campaña" : "Crear campaña"}</div>
        </div>

        <div className="admin-form">
          <div className="admin-field">
            <div className="admin-label">Nombre</div>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ej: Promo Home" />
          </div>
          <div className="admin-field">
            <div className="admin-label">Status</div>
            <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="ended">ended</option>
            </select>
          </div>
          <div className="admin-field">
            <div className="admin-label">Placement</div>
            <select value={draft.placement} onChange={(e) => setDraft((d) => ({ ...d, placement: e.target.value }))}>
              <option value="home">home</option>
              <option value="explore">explore</option>
              <option value="store">store</option>
            </select>
          </div>
          <div className="admin-field">
            <div className="admin-label">Targeting (JSON)</div>
            <textarea value={draft.targetingJson} onChange={(e) => setDraft((d) => ({ ...d, targetingJson: e.target.value }))} style={{ minHeight: 110 }} />
          </div>
          <div className="admin-field">
            <div className="admin-label">Creative (JSON)</div>
            <textarea value={draft.creativeJson} onChange={(e) => setDraft((d) => ({ ...d, creativeJson: e.target.value }))} style={{ minHeight: 110 }} />
          </div>

          {!selected ? (
            <button className="primary-btn" type="button" disabled={saving} onClick={create}>
              {saving ? "Creando…" : "Crear"}
            </button>
          ) : (
            <>
              <button className="primary-btn" type="button" disabled={saving} onClick={save}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button className="logout-btn" type="button" disabled={saving} onClick={removeOne}>
                Eliminar
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

