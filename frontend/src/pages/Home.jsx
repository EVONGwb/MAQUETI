import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppLogo from "../components/AppLogo.jsx";
import { createOrGetConversation, resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export default function HomePage({ products, search, setSearch, categories, activeCategory, setActiveCategory, loading, error, favorites, toggleFavorite, token, onRequireAuth }) {
  const navigate = useNavigate();
  const [chatError, setChatError] = useState("");

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

  const storesData = [
    { id: 1, name: "Tech Urban", tag: "Premium Tech", avatar: "TU" },
    { id: 2, name: "Street Mode", tag: "Moda urbana", avatar: "SM" },
    { id: 3, name: "Game Hub", tag: "Gaming", avatar: "GH" },
  ];

  const productSkeletons = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({ id: `sk-${i}` })), []);
  const storeSkeletons = useMemo(() => Array.from({ length: 3 }).map((_, i) => ({ id: `sk-store-${i}` })), []);

  const badgeLabel = (product) => (product?.featured || product?.isFeatured ? "Destacado" : "Nuevo");

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <div className="st-home">
      <div className="st-bg-orb st-bg-orb-1" />
      <div className="st-bg-orb st-bg-orb-2" />

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


      </motion.header>

      <motion.main className="st-main" variants={stagger} initial="hidden" animate="show">
        <motion.section className="st-hero" variants={reveal}>
          <motion.div className="st-hero-content" variants={revealFast}>
            <span className="st-pill">Compra, vende y crea tu tienda</span>

            <h2>
              Compra y vende <span>como un pro</span>
            </h2>

            <p>Productos, tiendas y chat en tiempo real.</p>

            <div className="st-search">
              <span className="st-search-icon">🔎</span>
              <input type="text" placeholder="iPhone, zapatillas, coches..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="button" onClick={() => navigate("/explore")}>
                Buscar
              </button>
            </div>

            <div className="st-hero-cta-row">
              <button className="st-primary-btn" type="button" onClick={() => navigate("/explore")}>
                Explorar productos
              </button>
              <button className="st-secondary-btn" type="button" onClick={() => (token ? navigate("/store") : onRequireAuth?.())}>
                Abrir mi tienda
              </button>
            </div>
          </motion.div>

          <motion.div className="st-hero-side" variants={stagger}>
            <motion.div className="st-feature-card st-feature-dark" variants={revealFast} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
              <h3>🔥 Tendencias hoy</h3>
              <p>Lo más vendido ahora mismo.</p>
              <button type="button" onClick={() => scrollToId("st-trending")}>
                Ver productos
              </button>
            </motion.div>

            <motion.div className="st-feature-card" variants={revealFast} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
              <span className="st-feature-tag blue">NUEVO</span>
              <h3>Tiendas con stock</h3>
              <p>Controla catálogo, inventario y publicaciones desde una sola app.</p>
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
            {loading
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
              : storesData.map((store) => (
                  <motion.article key={store.id} className="st-store-card" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                    <div className="st-store-top">
                      <div className="st-store-avatar">{store.avatar}</div>
                      <div>
                        <h4>{store.name}</h4>
                        <p>{store.tag}</p>
                      </div>
                    </div>
                    <button className="st-store-btn" type="button">
                      Visitar tienda
                    </button>
                  </motion.article>
                ))}
          </div>
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
                  onClick={() => navigate(`/product/${product.id}`)}
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

        <motion.section className="st-section" variants={revealFast}>
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
                  onClick={() => navigate(`/product/${product.id}`)}
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
                  onClick={() => navigate(`/product/${product.id}`)}
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
