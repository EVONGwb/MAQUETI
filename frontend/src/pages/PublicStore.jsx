import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPublicStore, resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export default function PublicStorePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchPublicStore(slug);
        if (cancelled) return;
        setStore(data.store);
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "No se pudo cargar la tienda");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const themeStyle = useMemo(() => {
    if (!store) return {};
    return {
      background: store.themeBackground || "#ffffff",
    };
  }, [store]);

  if (loading) {
    return (
      <div className="view-container">
        <h2>Tienda</h2>
        <div className="empty-state">Cargando…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-container">
        <h2>Tienda</h2>
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="view-container">
        <h2>Tienda</h2>
        <div className="empty-state">No encontrada</div>
      </div>
    );
  }

  return (
    <div className="view-container" style={themeStyle}>
      <div className="store-header" style={{ margin: 0, borderRadius: 24, overflow: "hidden" }}>
        <div
          className="store-banner placeholder-img"
          style={store.bannerUrl ? { backgroundImage: `url(${resolveImageSrc(store.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />
        <div className="store-profile">
          <div
            className="store-avatar"
            style={store.logoUrl ? { backgroundImage: `url(${resolveImageSrc(store.logoUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          />
          <div>
            <h2 style={{ color: store.themeAccent || "#0f172a" }}>{store.name}</h2>
            <p>{store.description || ""}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
        <button className="secondary-btn" type="button" onClick={() => navigate("/")}>
          Volver
        </button>
        <button className="primary-btn" type="button" onClick={() => navigate("/explore")}>
          Explorar
        </button>
      </div>

      <h3 style={{ marginTop: 18 }}>Productos</h3>
      {products.length === 0 ? <div className="empty-state">Aún no hay productos publicados.</div> : null}
      <div className="product-grid">
        {products.map((p) => (
          <div key={p.id} className="feed-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/product/${p.id}`)}>
            <div className="feed-img placeholder-img" style={{ backgroundImage: `url(${resolveImageSrc(p.imageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="feed-details">
              <h4>{p.title}</h4>
              <p className="price-large">{priceLabel(p.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
