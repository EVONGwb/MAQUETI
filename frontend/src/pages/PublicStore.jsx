import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchPublicStore, resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export default function PublicStorePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
      "--shop-primary": store.themePrimary || "#2563eb",
      "--shop-accent": store.themeAccent || "#0f172a",
      "--shop-bg": store.themeBackground || "#ffffff",
      background: store.themeBackground || "#ffffff",
    };
  }, [store]);

  const visibleProducts = useMemo(() => Array.isArray(products) ? products : [], [products]);
  const featuredProducts = useMemo(() => visibleProducts.slice(0, 8), [visibleProducts]);
  const adBannerProducts = useMemo(() => {
    if (!featuredProducts.length) return [];
    const targetCount = Math.max(6, featuredProducts.length * 2);
    return Array.from({ length: targetCount }, (_, index) => featuredProducts[index % featuredProducts.length]);
  }, [featuredProducts]);
  const categories = useMemo(() => {
    const set = new Set();
    visibleProducts.forEach((p) => set.add(p.category || "Otros"));
    return [...set].slice(0, 8);
  }, [visibleProducts]);

  const openProduct = (productId) => {
    navigate(`/product/${productId}`, {
      state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } },
    });
  };

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
    <div className={`shop-page shop-${store.layoutStyle || "boutique"}`} style={themeStyle}>
      <section className="shop-hero">
        <div
          className="shop-cover"
          style={store.bannerUrl ? { backgroundImage: `url(${resolveImageSrc(store.bannerUrl)})` } : {}}
        >
          <div className="shop-cover-shade" />
          {store.announcement ? <div className="shop-announcement">{store.announcement}</div> : null}
        </div>

        <div className="shop-profile-card">
          <div
            className="shop-logo"
            style={store.logoUrl ? { backgroundImage: `url(${resolveImageSrc(store.logoUrl)})` } : {}}
          >
            {!store.logoUrl ? String(store.name || "T").slice(0, 2).toUpperCase() : null}
          </div>
          <div className="shop-profile-main">
            <p className="shop-kicker">Tienda Pro en MAQUETI</p>
            <h1>{store.name}</h1>
            {store.tagline ? <p className="shop-tagline">{store.tagline}</p> : null}
            <p className="shop-description">{store.description || "Una tienda independiente con productos seleccionados para ti."}</p>
            <div className="shop-actions">
              <button type="button" onClick={() => navigate("/")}>Volver a MAQUETI</button>
              <button type="button" className="primary" onClick={() => navigate("/explore")}>Explorar marketplace</button>
              {store.instagramUrl ? <a href={store.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
              {store.whatsappUrl ? <a href={store.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a> : null}
            </div>
          </div>
          <div className="shop-stats-panel">
            <div><strong>{visibleProducts.length}</strong><span>productos</span></div>
            <div><strong>{categories.length}</strong><span>categorías</span></div>
            <div><strong>Pro</strong><span>escaparate</span></div>
          </div>
        </div>
      </section>

      {store.welcomeMessage ? (
        <section className="shop-message">
          <span>Mensaje de la tienda</span>
          <p>{store.welcomeMessage}</p>
        </section>
      ) : null}

      {featuredProducts.length ? (
        <section className="shop-section shop-ad-section">
          <div className="shop-section-head">
            <div>
              <p>Escaparate publicitario</p>
              <h2>Destacados de la tienda</h2>
            </div>
          </div>
          <div className="shop-featured-grid shop-ad-marquee" aria-label="Productos destacados">
            <div className="shop-ad-track">
              {[...adBannerProducts, ...adBannerProducts].map((p, index) => (
                <article key={`${p.id}-${index}`} className="shop-featured-card shop-ad-card" onClick={() => openProduct(p.id)}>
                  <img src={resolveImageSrc(p.imageUrl)} alt={p.title} />
                  <div className="shop-ad-copy">
                    <span>{p.category || "Producto destacado"}</span>
                    <h3>{p.title}</h3>
                    <strong>{priceLabel(p.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {categories.length ? (
        <section className="shop-categories" aria-label="Categorías de la tienda">
          {categories.map((category) => <span key={category}>{category}</span>)}
        </section>
      ) : null}

      <section className="shop-section">
        <div className="shop-section-head">
          <div>
            <p>Catálogo completo</p>
            <h2>Todo el stock disponible</h2>
          </div>
          <button type="button" onClick={() => navigate("/explore")}>Ver más tiendas</button>
        </div>

        {visibleProducts.length === 0 ? <div className="shop-empty">Aún no hay productos publicados.</div> : null}
        <div className="shop-product-grid">
          {visibleProducts.map((p) => (
            <article key={p.id} className="shop-product-card" onClick={() => openProduct(p.id)}>
              <div className="shop-product-img" style={{ backgroundImage: `url(${resolveImageSrc(p.imageUrl)})` }}>
                <span>{p.condition || "Disponible"}</span>
              </div>
              <div className="shop-product-body">
                <p>{p.category || "Producto"}</p>
                <h3>{p.title}</h3>
                <div>
                  <strong>{priceLabel(p.price)}</strong>
                  <small>{p.stock === null || p.stock === undefined ? "Stock activo" : `${p.stock} en stock`}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
