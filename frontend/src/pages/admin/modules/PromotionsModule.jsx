import React, { useEffect, useMemo, useState } from "react";
import { adminFetchPromotions, adminGetPromotionConfig, adminPatchPromotion, adminPatchPromotionConfig } from "../../../services/api.js";
import { priceLabel } from "../../../services/format.js";

const hoursLabel = (h) => {
  const n = Number(h);
  if (!Number.isFinite(n) || !n) return "—";
  if (n % 24 === 0) {
    const d = n / 24;
    return d === 1 ? "1 día" : `${d} días`;
  }
  return `${n}h`;
};

export default function PromotionsModule({ token }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [promotions, setPromotions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState("");

  const [config, setConfig] = useState(null);
  const [pricingText, setPricingText] = useState("");
  const [limitsText, setLimitsText] = useState("");

  const selected = useMemo(() => promotions.find((p) => String(p.id) === String(selectedId)) || null, [promotions, selectedId]);

  const load = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [list, cfg] = await Promise.all([
        adminFetchPromotions(token, { status: statusFilter || undefined, promotionType: typeFilter || undefined }),
        adminGetPromotionConfig(token),
      ]);
      setPromotions(Array.isArray(list?.promotions) ? list.promotions : []);
      setConfig(cfg || null);
      setPricingText(cfg?.pricing ? JSON.stringify(cfg.pricing, null, 2) : "");
      setLimitsText(cfg?.limits ? JSON.stringify(cfg.limits, null, 2) : "");
    } catch (e) {
      setError(e?.message || "No se pudo cargar promociones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected) {
      setNotes("");
      return;
    }
    setNotes(selected.notes || "");
  }, [selectedId]);

  const patchOne = async (action) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await adminPatchPromotion(token, selected.id, { action, notes: notes || null });
      const updated = res?.promotion || null;
      if (updated) setPromotions((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
    } catch (e) {
      setError(e?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const pricing = pricingText ? JSON.parse(pricingText) : undefined;
      const limits = limitsText ? JSON.parse(limitsText) : undefined;
      await adminPatchPromotionConfig(token, { pricing, limits });
      await load();
    } catch (e) {
      setError(e?.message || "No se pudo guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const pricing = config?.pricing || {};

  return (
    <div className="admin-split">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Promociones</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">status: todos</option>
              <option value="pending_review">pending_review</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="rejected">rejected</option>
              <option value="canceled">canceled</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">tipo: todos</option>
              <option value="home">home</option>
              <option value="category">category</option>
              <option value="search">search</option>
              <option value="boost">boost</option>
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
                <th>Producto</th>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id} className={String(selectedId) === String(p.id) ? "active" : ""} onClick={() => setSelectedId(p.id)}>
                  <td>{p.id}</td>
                  <td>{p.productId}</td>
                  <td>{p.userId}</td>
                  <td>{p.promotionType}</td>
                  <td>{priceLabel((Number(p.priceCents) || 0) / 100)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
              {!loading && promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    No hay promociones.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Detalle</div>
        </div>

        {!selected ? (
          <div className="admin-muted">Selecciona una promoción.</div>
        ) : (
          <div className="admin-form">
            <div className="admin-field">
              <div className="admin-label">Tipo</div>
              <div className="admin-value">{selected.promotionType}</div>
            </div>
            <div className="admin-field">
              <div className="admin-label">Duración</div>
              <div className="admin-value">{hoursLabel(selected.durationHours)}</div>
            </div>
            <div className="admin-field">
              <div className="admin-label">Precio</div>
              <div className="admin-value">{priceLabel((Number(selected.priceCents) || 0) / 100)}</div>
            </div>
            {selected.category ? (
              <div className="admin-field">
                <div className="admin-label">Categoría</div>
                <div className="admin-value">{selected.category}</div>
              </div>
            ) : null}
            <div className="admin-field">
              <div className="admin-label">Notas</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 120 }} />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="primary-btn" type="button" disabled={saving} onClick={() => patchOne("approve")}>
                Aprobar
              </button>
              <button className="secondary-btn" type="button" disabled={saving} onClick={() => patchOne("pause")}>
                Pausar
              </button>
              <button className="secondary-btn" type="button" disabled={saving} onClick={() => patchOne("reject")}>
                Rechazar
              </button>
              <button className="logout-btn" type="button" disabled={saving} onClick={() => patchOne("cancel")}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Precios y límites</div>
        </div>

        <div className="admin-form">
          <div className="admin-muted">
            {`Home ${priceLabel((Number(pricing.home?.priceCents) || 0) / 100)} · Category ${priceLabel((Number(pricing.category?.priceCents) || 0) / 100)} · Search ${priceLabel(
              (Number(pricing.search?.priceCents) || 0) / 100
            )} · Boost ${priceLabel((Number(pricing.boost?.priceCents) || 0) / 100)}`}
          </div>
          <div className="admin-field">
            <div className="admin-label">Pricing (JSON)</div>
            <textarea value={pricingText} onChange={(e) => setPricingText(e.target.value)} style={{ minHeight: 160 }} />
          </div>
          <div className="admin-field">
            <div className="admin-label">Limits (JSON)</div>
            <textarea value={limitsText} onChange={(e) => setLimitsText(e.target.value)} style={{ minHeight: 120 }} />
          </div>
          <button className="primary-btn" type="button" disabled={saving} onClick={saveConfig}>
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </section>
    </div>
  );
}

