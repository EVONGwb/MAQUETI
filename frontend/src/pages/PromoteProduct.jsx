import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchMyPromotions, fetchPromotionConfig, requestProductPromotion } from "../services/api";
import { priceLabel } from "../services/format";

const hoursLabel = (h) => {
  const n = Number(h);
  if (!Number.isFinite(n) || !n) return "";
  if (n % 24 === 0) {
    const d = n / 24;
    return d === 1 ? "1 día" : `${d} días`;
  }
  return `${n}h`;
};

export default function PromoteProductPage({ token, myProducts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  const defaultProductId = params.get("productId") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);
  const [promos, setPromos] = useState([]);
  const [productId, setProductId] = useState(defaultProductId);
  const [promotionType, setPromotionType] = useState("home");
  const [saving, setSaving] = useState(false);

  const products = Array.isArray(myProducts) ? myProducts : [];
  const selectedProduct = useMemo(() => products.find((p) => String(p.id) === String(productId)) || null, [products, productId]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [cfg, mine] = await Promise.all([fetchPromotionConfig(), fetchMyPromotions(token)]);
      setConfig(cfg || null);
      setPromos(Array.isArray(mine?.promotions) ? mine.promotions : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar promociones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    if (!productId && products.length) setProductId(String(products[0].id));
  }, [products.length]);

  const pricing = config?.pricing || {};
  const plan = pricing[promotionType] || null;
  const price = plan?.priceCents ? priceLabel((Number(plan.priceCents) || 0) / 100) : "—";
  const duration = plan?.durationHours ? hoursLabel(plan.durationHours) : "—";

  const submit = async () => {
    if (!token) return;
    if (!selectedProduct) {
      setError("Selecciona un producto.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        productId: selectedProduct.id,
        promotionType,
        category: promotionType === "category" ? (selectedProduct.category || "Otros") : undefined,
      };
      await requestProductPromotion(token, payload);
      await load();
      navigate("/profile");
    } catch (e) {
      setError(e?.message || "No se pudo solicitar la promoción");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="view-container">
        <h2>Promocionar</h2>
        <div className="empty-state">Inicia sesión para promocionar productos.</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2>Promocionar producto</h2>
      <div className="empty-state" style={{ textAlign: "left" }}>
        Elige un producto y una promoción para aumentar su visibilidad.
      </div>

      {error ? <div className="msg">{error}</div> : null}
      {loading ? <div className="empty-state">Cargando…</div> : null}

      <div className="store-block" style={{ marginTop: 12 }}>
        <div className="store-block-head">
          <h3>Producto</h3>
          <p>Selecciona cuál quieres destacar.</p>
        </div>
        <div className="store-field">
          <label>Mis productos</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} style={{ height: 48, borderRadius: 16, padding: "0 14px" }}>
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {`${p.title} · ${priceLabel(p.price)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="store-block" style={{ marginTop: 12 }}>
        <div className="store-block-head">
          <h3>Tipo de promoción</h3>
          <p>Máximo 2–3 destacados por sección.</p>
        </div>
        <div className="store-color-grid" style={{ gridTemplateColumns: "1fr", marginTop: 10 }}>
          <label className="admin-check" style={{ justifyContent: "space-between" }}>
            <span>Home</span>
            <input type="radio" name="promoType" checked={promotionType === "home"} onChange={() => setPromotionType("home")} />
          </label>
          <label className="admin-check" style={{ justifyContent: "space-between" }}>
            <span>Categorías</span>
            <input type="radio" name="promoType" checked={promotionType === "category"} onChange={() => setPromotionType("category")} />
          </label>
          <label className="admin-check" style={{ justifyContent: "space-between" }}>
            <span>Buscador</span>
            <input type="radio" name="promoType" checked={promotionType === "search"} onChange={() => setPromotionType("search")} />
          </label>
          <label className="admin-check" style={{ justifyContent: "space-between" }}>
            <span>Boost (temporal)</span>
            <input type="radio" name="promoType" checked={promotionType === "boost"} onChange={() => setPromotionType("boost")} />
          </label>
        </div>
        <div className="store-preview-hint" style={{ marginTop: 10 }}>
          {`Precio: ${price} · Duración: ${duration}`}
        </div>
      </div>

      <div className="store-cta">
        <button className="primary-btn store-cta-btn" type="button" disabled={saving} onClick={submit}>
          {saving ? "Procesando…" : "Pagar y destacar"}
        </button>
        <div className="store-cta-hint">Pago/activación: pendiente de aprobación del admin.</div>
      </div>

      <div className="store-block" style={{ marginTop: 18 }}>
        <div className="store-block-head">
          <h3>Mis promociones</h3>
          <p>Estado de tus solicitudes.</p>
        </div>
        <div className="inventory-list" style={{ marginTop: 10 }}>
          {promos.slice(0, 10).map((p) => (
            <div key={p.id} className="inventory-item" style={{ alignItems: "flex-start" }}>
              <div className="inv-info">
                <h4 style={{ marginBottom: 4 }}>{`#${p.id} · ${p.promotionType}`}</h4>
                <p style={{ margin: 0 }}>{`Producto ${p.productId} · ${p.status} · ${p.paymentStatus}`}</p>
              </div>
            </div>
          ))}
          {!promos.length ? <div className="empty-state">Aún no tienes promociones.</div> : null}
        </div>
      </div>
    </div>
  );
}

