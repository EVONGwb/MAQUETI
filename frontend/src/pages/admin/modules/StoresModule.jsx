import React, { useEffect, useMemo, useState } from "react";
import { adminFetchStores, adminUpdateStore } from "../../../services/api.js";

export default function StoresModule({ token }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => stores.find((s) => String(s.id) === String(selectedId)) || null, [stores, selectedId]);

  const [draft, setDraft] = useState({
    name: "",
    slug: "",
    status: "active",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    themePrimary: "",
    themeAccent: "",
    themeBackground: "",
  });

  const load = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminFetchStores(token, { q: q || undefined, status: statusFilter || undefined });
      setStores(Array.isArray(data?.stores) ? data.stores : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar tiendas");
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
      slug: selected.slug || "",
      status: selected.status || "active",
      description: selected.description || "",
      logoUrl: selected.logoUrl || "",
      bannerUrl: selected.bannerUrl || "",
      themePrimary: selected.themePrimary || "#2563eb",
      themeAccent: selected.themeAccent || "#0f172a",
      themeBackground: selected.themeBackground || "#ffffff",
    });
  }, [selectedId]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        status: draft.status,
        name: draft.name,
        description: draft.description,
        logoUrl: draft.logoUrl,
        bannerUrl: draft.bannerUrl,
        themePrimary: draft.themePrimary,
        themeAccent: draft.themeAccent,
        themeBackground: draft.themeBackground,
      };
      const res = await adminUpdateStore(selected.id, token, payload);
      const updated = res?.store || null;
      if (updated) setStores((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
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
          <div className="admin-panel-title">Tiendas</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (nombre/slug)" style={{ height: 44, borderRadius: 12, padding: "0 12px" }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">status: todos</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="blocked">blocked</option>
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
                <th>Slug</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className={String(selectedId) === String(s.id) ? "active" : ""} onClick={() => setSelectedId(s.id)}>
                  <td>{s.id}</td>
                  <td>{s.name || "—"}</td>
                  <td>{s.slug || "—"}</td>
                  <td>{s.status || "active"}</td>
                </tr>
              ))}
              {!loading && stores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-muted">
                    No hay tiendas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Edición</div>
        </div>

        {!selected ? (
          <div className="admin-muted">Selecciona una tienda.</div>
        ) : (
          <div className="admin-form">
            <div className="admin-field">
              <div className="admin-label">Nombre</div>
              <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Slug</div>
              <input value={draft.slug} disabled />
            </div>
            <div className="admin-field">
              <div className="admin-label">Status</div>
              <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="blocked">blocked</option>
              </select>
            </div>
            <div className="admin-field">
              <div className="admin-label">Descripción</div>
              <input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Logo URL</div>
              <input value={draft.logoUrl} onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Banner URL</div>
              <input value={draft.bannerUrl} onChange={(e) => setDraft((d) => ({ ...d, bannerUrl: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Theme primary</div>
              <input value={draft.themePrimary} onChange={(e) => setDraft((d) => ({ ...d, themePrimary: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Theme accent</div>
              <input value={draft.themeAccent} onChange={(e) => setDraft((d) => ({ ...d, themeAccent: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Theme background</div>
              <input value={draft.themeBackground} onChange={(e) => setDraft((d) => ({ ...d, themeBackground: e.target.value }))} />
            </div>
            <button className="primary-btn" type="button" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

