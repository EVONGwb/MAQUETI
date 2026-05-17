import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import AppLogo from "../components/AppLogo.jsx";
import { createOrGetConversation, fetchPromotedProducts, fetchPublicStores, resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";
import GlobalSearchHeader from "../components/GlobalSearchHeader";

export default function HomePage({ products, search, setSearch, categories, activeCategory, setActiveCategory, loading, error, favorites, toggleFavorite, token, onRequireAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatError, setChatError] = useState("");
  const [storesLoading, setStoresLoading] = useState(true);
  const [recommendedStores, setRecommendedStores] = useState([]);
  const [promotedLoading, setPromotedLoading] = useState(true);
  const [promotedProducts, setPromotedProducts] = useState([]);

  const reveal = useMemo(
    () => ({
      hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
      show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.2, 0.9, 0.2, 1] } },
    }),
    []
  );

  const revealFast = useMemo(
    () => ({
      hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
      show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.42, ease: [0.2, 0.9, 0.2, 1] } },
    }),
    []
  );

  const stagger = useMemo(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: 0.06 } },
    }),
    []
  );

  const categoriesData = useMemo(() => {
    const iconMap = {
      "Electrónica": "📱",
      "Moda": "👕",
      "Gaming": "🎮",
      "Hogar": "🏠",
      "Motor": "🚗",
      "Deporte": "⚽",
      "Belleza": "💄",
      "Coleccionismo": "🧩",
      "Otros": "📦",
    };
    return categories.map((c) => ({ name: c, icon: iconMap[c] || "✨" }));
  }, [categories]);

  const categoriesAll = useMemo(() => [{ name: "Todas", icon: "✨" }, ...categoriesData], [categoriesData]);
  const selectedCategory = activeCategory || "Todas";

  const filteredProducts = useMemo(() => {
    const byCategory = selectedCategory === "Todas" ? products : products.filter((p) => (p.category || "Otros") === selectedCategory);
    const term = String(search || "").toLowerCase();
    if (!term) return byCategory;
    return byCategory.filter((p) => {
      const title = String(p.title || "").toLowerCase();
      const location = String(p.location || "").toLowerCase();
      const category = String(p.category || "").toLowerCase();
      return title.includes(term) || location.includes(term) || category.includes(term);
    });
  }, [products, selectedCategory, search]);

  const trendingProducts = useMemo(() => {
    const list = selectedCategory === "Todas" ? products : products.filter((p) => (p.category || "Otros") === selectedCategory);
    const featured = list.filter((p) => Boolean(p?.featured || p?.isFeatured));
    return (featured.length ? featured : list).slice(0, 6);
  }, [products, selectedCategory]);

  const recentlyPublishedProducts = useMemo(() => {
    const list = selectedCategory === "Todas" ? products : products.filter((p) => (p.category || "Otros") === selectedCategory);
    return [...list].slice(-6).reverse();
  }, [products, selectedCategory]);

  const productSkeletons = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({ id: `sk-${i}` })), []);
  const storeSkeletons = useMemo(() => Array.from({ length: 3 }).map((_, i) => ({ id: `sk-store-${i}` })), []);
  const heroPreviewProducts = useMemo(() => {
    const source = filteredProducts.length ? filteredProducts : products;
    return source.slice(0, 3);
  }, [filteredProducts, products]);
  const heroShowcaseProducts = heroPreviewProducts.length ? heroPreviewProducts : products.slice(0, 3);
  const marketplaceStats = useMemo(
    () => [
      { value: products.length || "0", label: "productos activos" },
      { value: categories.length || "0", label: "categorías vivas" },
      { value: recommendedStores.length || "0", label: "tiendas visibles" },
    ],
    [categories.length, products.length, recommendedStores.length]
  );

  const badgeLabel = (product) => (product?.featured || product?.isFeatured ? "Destacado" : "Nuevo");

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openProduct = (productId) => {
    navigate(`/product/${productId}`, {
      state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } },
    });
  };

  const handleStartChat = async (productId) => {
    setChatError("");
    if (!token) {
      onRequireAuth?.();
      return;
    }
    try {
      const data = await createOrGetConversation(productId, token);
      navigate(`/chats/${data.conversation.id}`);
    } catch (e) {
      if (e?.nonJson) {
        setChatError("Respuesta inesperada del servidor. Revisa que VITE_API_URL apunte al backend.");
      } else {
        setChatError(e?.message || "No se pudo iniciar la conversación");
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStoresLoading(true);
      try {
        const data = await fetchPublicStores({ limit: 3 });
        const list = Array.isArray(data?.stores) ? data.stores : [];
        if (!cancelled) setRecommendedStores(list);
      } catch {
        if (!cancelled) setRecommendedStores([]);
      } finally {
        if (!cancelled) setStoresLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setPromotedLoading(true);
      try {
        const data = await fetchPromotedProducts({ placement: "home", limit: 3 });
        const list = Array.isArray(data?.products) ? data.products : [];
        if (!cancelled) setPromotedProducts(list);
      } catch {
        if (!cancelled) setPromotedProducts([]);
      } finally {
        if (!cancelled) setPromotedLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const storeAvatarText = (store) => {
    const name = String(store?.name || "").trim();
    if (!name) return "TI";
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "T";
    const b = parts[1]?.[0] || parts[0]?.[1] || "I";
    return `${String(a).toUpperCase()}${String(b).toUpperCase()}`;
  };

  const storeTag = (store) => {
    const d = String(store?.description || "").trim();
    if (d) return d.length > 48 ? `${d.slice(0, 48)}…` : d;
    return "Tienda en MAQUETI";
  };

  return (
    <div className="st-home">
      <motion.header className="st-header" variants={reveal} initial="hidden" animate="show">
        <div className="st-brand">
          <div className="st-logo-box">
            <AppLogo className="st-logo-img" alt="MAQUETI" />
          </div>
          <div>
            <p className="st-brand-kicker">Marketplace urbano</p>
            <h1>MAQUETI</h1>
          </div>
        </div>

        <GlobalSearchHeader
          search={search}
          setSearch={setSearch}
          categories={categories}
          setActiveCategory={setActiveCategory}
          products={products}
        />
      </motion.header>

      <motion.main className="st-main" variants={stagger} initial="hidden" animate="show">
        <motion.section className="st-hero" variants={reveal}>
          <motion.div className="st-hero-content" variants={revealFast}>
            <span className="st-pill">Marketplace social de nueva generación</span>

            <h2>
              Compra, vende y negocia <span>sin perder el ritmo</span>
            </h2>

            <div className="st-hero-cta-row">
              <button className="st-primary-btn" type="button" onClick={() => (token ? navigate("/add") : onRequireAuth?.())}>
                Publicar producto
              </button>
            </div>

            <div className="st-hero-stats" aria-label="Resumen de MAQUETI">
              {marketplaceStats.map((stat) => (
                <div className="st-hero-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="st-hero-side" variants={stagger}>
            <motion.div className="st-market-panel st-market-panel-compact st-market-panel-screen-only" variants={revealFast}>
              <div className="st-market-screen" aria-label="Escaparate de productos">
                {loading
                  ? (
                    <div className="st-screen-slide st-screen-slide-active">
                      <div className="st-skeleton st-screen-image" />
                      <div className="st-screen-caption">
                        <div className="st-skeleton st-skeleton-line st-w-70" />
                        <div className="st-skeleton st-skeleton-line st-w-40" />
                      </div>
                    </div>
                  )
                  : heroShowcaseProducts.map((product, index) => (
                      <button
                        className="st-screen-slide"
                        type="button"
                        key={product.id}
                        onClick={() => openProduct(product.id)}
                        style={{ "--slide-index": index }}
                      >
                        <img className="st-screen-image" src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                        <div className="st-screen-live">
                          <span />
                          En escaparate
                        </div>
                        <div className="st-screen-caption">
                          <p>{product.category || "Producto"}</p>
                          <strong>{product.title}</strong>
                          <small>{priceLabel(product.price)} · {product.location || "Sin ubicación"}</small>
                        </div>
                      </button>
                    ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section className="st-section" variants={revealFast}>
          <div className="st-section-head">
            <div>
              <p className="st-section-kicker">Explora</p>
              <h3>Categorías</h3>
            </div>
            <button className="st-text-btn" type="button" onClick={() => navigate("/explore")}>
              Ver todo
            </button>
          </div>

          <div className="st-categories">
            {categoriesAll.map((category) => (
              <motion.button
                key={category.name}
                className={`st-category-chip ${selectedCategory === category.name ? "active" : ""}`}
                onClick={() => setActiveCategory(category.name === "Todas" ? "" : category.name)}
                type="button"
                whileTap={{ scale: 0.985 }}
              >
                <span>{category.icon}</span>
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section className="st-section" variants={revealFast}>
          <div className="st-section-head">
            <div>
              <p className="st-section-kicker">Destacado</p>
              <h3>Tiendas recomendadas</h3>
            </div>
            <button className="st-text-btn" type="button">
              Ver todas
            </button>
          </div>

          <div className="st-stores">
            {storesLoading || loading
              ? storeSkeletons.map((s) => (
                  <div key={s.id} className="st-store-card st-skeleton-card">
                    <div className="st-store-top">
                      <div className="st-store-avatar st-skeleton st-skeleton-avatar" />
                      <div className="st-skeleton-lines">
                        <div className="st-skeleton st-skeleton-line st-w-70" />
                        <div className="st-skeleton st-skeleton-line st-w-50" />
                      </div>
                    </div>
                    <div className="st-skeleton st-skeleton-btn" />
                  </div>
                ))
              : recommendedStores.length === 0
                ? <div className="st-empty-state">Aún no hay tiendas disponibles.</div>
                : recommendedStores.map((store) => (
                    <motion.article key={store.id || store.slug} className="st-store-card" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} tabIndex={0}>
                      <div className="st-store-top">
                        <div
                          className="st-store-avatar"
                          style={
                            store?.logoUrl
                              ? { backgroundImage: `url(${resolveImageSrc(store.logoUrl)})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" }
                              : undefined
                          }
                        >
                          {store?.logoUrl ? null : storeAvatarText(store)}
                        </div>
                        <div>
                          <h4>{store.name}</h4>
                          <p>{storeTag(store)}</p>
                        </div>
                      </div>
                      <button className="st-store-btn" type="button" onClick={() => navigate(`/shop/${store.slug}`)}>
                        Visitar tienda
                      </button>
                    </motion.article>
                  ))}
          </div>
        </motion.section>

        <motion.section className="st-section" variants={revealFast}>
          <div className="st-section-head">
            <div>
              <p className="st-section-kicker">🚀 Promocionado</p>
              <h3>Destacados en Home</h3>
            </div>
            <button className="st-text-btn" type="button" onClick={() => navigate("/explore")}>
              Ver más
            </button>
          </div>

          {promotedLoading ? (
            <div className="st-products-row">
              {productSkeletons.slice(0, 3).map((s) => (
                <div key={s.id} className="st-product-card st-skeleton-card st-product-card-compact">
                  <div className="st-product-image-wrap">
                    <div className="st-skeleton st-skeleton-img st-skeleton-img-compact" />
                  </div>
                  <div className="st-product-info">
                    <div className="st-skeleton st-skeleton-line st-w-40" />
                    <div className="st-skeleton st-skeleton-line st-w-80" />
                    <div className="st-skeleton st-skeleton-line st-w-55" />
                  </div>
                </div>
              ))}
            </div>
          ) : promotedProducts.length === 0 ? (
            <div className="st-empty-state">No hay productos promocionados ahora mismo.</div>
          ) : (
            <motion.div className="st-products-row" variants={stagger}>
              {promotedProducts.map((product) => (
                <motion.article
                  key={product.id}
                  className="st-product-card st-product-card-compact"
                  variants={revealFast}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openProduct(product.id)}
                >
                  <div className="st-product-image-wrap">
                    <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                    <span className="st-badge">Promocionado</span>
                  </div>
                  <div className="st-product-info">
                    <h4>{product.title}</h4>
                    <p>{priceLabel(product.price)}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </motion.section>

        <motion.section className="st-section" id="st-trending" variants={revealFast}>
          <div className="st-section-head">
            <div>
              <p className="st-section-kicker">🔥 Tendencias hoy</p>
              <h3>Lo que más se mueve</h3>
            </div>
            <button className="st-text-btn" type="button" onClick={() => navigate("/explore")}>
              Ver más
            </button>
          </div>

          {loading ? (
            <div className="st-products-row">
              {productSkeletons.map((s) => (
                <div key={s.id} className="st-product-card st-skeleton-card st-product-card-compact">
                  <div className="st-product-image-wrap">
                    <div className="st-skeleton st-skeleton-img st-skeleton-img-compact" />
                  </div>
                  <div className="st-product-info">
                    <div className="st-skeleton st-skeleton-line st-w-40" />
                    <div className="st-skeleton st-skeleton-line st-w-80" />
                    <div className="st-skeleton st-skeleton-line st-w-55" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="st-empty-state">Aún no hay productos para tendencias.</div>
          ) : (
            <motion.div className="st-products-row" variants={stagger}>
              {trendingProducts.map((product) => (
                <motion.article
                  key={product.id}
                  className="st-product-card st-product-card-compact"
                  variants={revealFast}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openProduct(product.id)}
                >
                  <div className="st-product-image-wrap">
                    <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                    <span className="st-badge">{badgeLabel(product)}</span>
                    <div className="st-product-overlay">
                      <button
                        className={`st-save-btn ${favorites.includes(product.id) ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        aria-label="Guardar"
                        type="button"
                      >
                        {favorites.includes(product.id) ? "❤" : "♡"}
                      </button>
                    </div>
                  </div>

                  <div className="st-product-info">
                    <p className="st-product-category">{product.category || "Otros"}</p>
                    <h4>{product.title}</h4>
                    <div className="st-product-meta">
                      <strong>{priceLabel(product.price)}</strong>
                      <span>{product.location || "Sin ubicación"}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </motion.section>

        <motion.section className="st-section st-recent-section" variants={revealFast}>
          <div className="st-section-head">
            <div>
              <p className="st-section-kicker">✨ Recién publicado</p>
              <h3>Novedades</h3>
            </div>
            <button className="st-text-btn" type="button" onClick={() => navigate("/explore")}>
              Ver más
            </button>
          </div>

          {loading ? (
            <div className="st-products-row">
              {productSkeletons.map((s) => (
                <div key={s.id} className="st-product-card st-skeleton-card st-product-card-compact">
                  <div className="st-product-image-wrap">
                    <div className="st-skeleton st-skeleton-img st-skeleton-img-compact" />
                  </div>
                  <div className="st-product-info">
                    <div className="st-skeleton st-skeleton-line st-w-40" />
                    <div className="st-skeleton st-skeleton-line st-w-80" />
                    <div className="st-skeleton st-skeleton-line st-w-55" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentlyPublishedProducts.length === 0 ? (
            <div className="st-empty-state">Aún no hay productos recientes.</div>
          ) : (
            <motion.div className="st-products-row" variants={stagger}>
              {recentlyPublishedProducts.map((product) => (
                <motion.article
                  key={product.id}
                  className="st-product-card st-product-card-compact"
                  variants={revealFast}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openProduct(product.id)}
                >
                  <div className="st-product-image-wrap">
                    <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                    <span className="st-badge">{badgeLabel(product)}</span>
                    <div className="st-product-overlay">
                      <button
                        className={`st-save-btn ${favorites.includes(product.id) ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        aria-label="Guardar"
                        type="button"
                      >
                        {favorites.includes(product.id) ? "❤" : "♡"}
                      </button>
                    </div>
                  </div>

                  <div className="st-product-info">
                    <p className="st-product-category">{product.category || "Otros"}</p>
                    <h4>{product.title}</h4>
                    <div className="st-product-meta">
                      <strong>{priceLabel(product.price)}</strong>
                      <span>{product.location || "Sin ubicación"}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </motion.section>

        <motion.section className="st-section st-products-section" variants={revealFast}>
          <div className="st-section-head">
            <div>
              <p className="st-section-kicker">Marketplace</p>
              <h3>Productos para ti</h3>
            </div>
            <button className="st-filter-btn" type="button" onClick={() => navigate("/explore")}>
              Filtros
            </button>
          </div>

          {loading ? (
            <div className="st-products-grid">
              {productSkeletons.map((s) => (
                <div key={s.id} className="st-product-card st-skeleton-card">
                  <div className="st-product-image-wrap">
                    <div className="st-skeleton st-skeleton-img" />
                  </div>
                  <div className="st-product-info">
                    <div className="st-skeleton st-skeleton-line st-w-35" />
                    <div className="st-skeleton st-skeleton-line st-w-90" />
                    <div className="st-skeleton st-skeleton-line st-w-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && products.length === 0 ? (
            <div className="st-empty-state">Error al cargar productos: {error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="st-empty-state">No encontramos productos con esos filtros.</div>
          ) : (
            <motion.div className="st-products-grid" variants={stagger}>
              {filteredProducts.map((product) => (
                <motion.article
                  key={product.id}
                  className="st-product-card"
                  variants={revealFast}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => openProduct(product.id)}
                  layout
                >
                  <div className="st-product-image-wrap">
                    <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                    <span className="st-badge">{badgeLabel(product)}</span>
                    <div className="st-product-overlay">
                      <button
                        className={`st-save-btn ${favorites.includes(product.id) ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        aria-label="Guardar"
                        type="button"
                      >
                        {favorites.includes(product.id) ? "❤" : "♡"}
                      </button>
                    </div>
                  </div>

                  <div className="st-product-info">
                    <p className="st-product-category">{product.category || "Otros"}</p>
                    <h4>{product.title}</h4>

                    <div className="st-product-meta">
                      <strong>{priceLabel(product.price)}</strong>
                      <span>{product.location || "Sin ubicación"}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          {chatError ? <div className="st-empty-state">No se pudo abrir el chat: {chatError}</div> : null}
        </motion.section>
      </motion.main>
    </div>
  );
}
