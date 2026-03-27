import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export default function HomePage({ products, search, setSearch, categories, activeCategory, setActiveCategory, loading, error, favorites, toggleFavorite }) {
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const byCategory = activeCategory ? products.filter((p) => (p.category || "Otros") === activeCategory) : products;
    if (!search) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((p) => String(p.title || "").toLowerCase().includes(q) || String(p.location || "").toLowerCase().includes(q));
  }, [products, search, activeCategory]);

  const featuredProducts = useMemo(() => filtered.slice(0, 4), [filtered]);

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

  const storesData = [
    { id: 1, name: "Tech Urban", tag: "Tecnología", rating: 4.9, products: 124, avatar: "TU" },
    { id: 2, name: "Moda Street", tag: "Ropa urbana", rating: 4.8, products: 86, avatar: "MS" },
    { id: 3, name: "Game Zone", tag: "Gaming", rating: 4.7, products: 59, avatar: "GZ" },
  ];

  return (
    <div className="mq-home">
      <header className="mq-topbar">
        <div className="mq-brand-wrap">
          <div className="mq-brand-badge">M</div>
          <div>
            <p className="mq-brand-subtitle">Marketplace urbano</p>
            <h1 className="mq-brand-title">MAQUETI</h1>
          </div>
        </div>

        <div className="mq-top-actions">
          <button className="mq-icon-btn" aria-label="Notificaciones" onClick={() => navigate("/notifications")}>
            🔔
          </button>
          <button className="mq-icon-btn" aria-label="Mensajes" onClick={() => navigate("/chats")}>
            💬
          </button>
        </div>
      </header>

      <main className="mq-main">
        <section className="mq-hero">
          <div className="mq-hero-content">
            <span className="mq-pill">Compra, vende y crea tu tienda</span>
            <h2>Todo lo que buscas en un solo lugar</h2>
            <p>Descubre productos, negocia por chat y gestiona tu tienda con una experiencia rápida y moderna.</p>

            <div className="mq-search">
              <span className="mq-search-icon">🔎</span>
              <input type="text" placeholder="¿Qué estás buscando hoy?" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="mq-search-btn" type="button">
                Buscar
              </button>
            </div>

            <div className="mq-hero-stats">
              <div className="mq-stat-card">
                <strong>{products.length}</strong>
                <span>Productos</span>
              </div>
              <div className="mq-stat-card">
                <strong>1.8K</strong>
                <span>Tiendas</span>
              </div>
              <div className="mq-stat-card">
                <strong>24/7</strong>
                <span>Chat activo</span>
              </div>
            </div>
          </div>

          <div className="mq-hero-side">
            <div className="mq-highlight-card mq-highlight-primary">
              <span className="mq-highlight-label">Tendencia</span>
              <h3>Electrónica premium</h3>
              <p>Productos destacados con envío rápido y vendedores verificados.</p>
            </div>

            <div className="mq-highlight-card">
              <span className="mq-highlight-label">Nuevo</span>
              <h3>Tiendas con stock</h3>
              <p>Controla catálogo, inventario y publicaciones desde una sola app.</p>
            </div>
          </div>
        </section>

        <section className="mq-section">
          <div className="mq-section-head">
            <div>
              <p className="mq-section-kicker">Explora</p>
              <h3>Categorías populares</h3>
            </div>
          </div>

          <div className="mq-categories-row">
            <button className={`mq-category-chip ${activeCategory === "" ? "active" : ""}`} onClick={() => setActiveCategory("")} type="button">
              <span>✨</span> Todas
            </button>
            {categoriesData.map((category) => (
              <button
                key={category.name}
                className={`mq-category-chip ${activeCategory === category.name ? "active" : ""}`}
                onClick={() => setActiveCategory(category.name)}
                type="button"
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="mq-section">
          <div className="mq-section-head">
            <div>
              <p className="mq-section-kicker">Destacado</p>
              <h3>Tiendas recomendadas</h3>
            </div>
            <button className="mq-link-btn" type="button">
              Ver todas
            </button>
          </div>

          <div className="mq-stores-grid">
            {storesData.map((store) => (
              <article key={store.id} className="mq-store-card">
                <div className="mq-store-top">
                  <div className="mq-store-avatar">{store.avatar}</div>
                  <div>
                    <h4>{store.name}</h4>
                    <p>{store.tag}</p>
                  </div>
                </div>

                <div className="mq-store-meta">
                  <span>⭐ {store.rating}</span>
                  <span>{store.products} productos</span>
                </div>

                <button className="mq-store-btn" type="button">
                  Visitar tienda
                </button>
              </article>
            ))}
          </div>
        </section>

        {!loading && !error && featuredProducts.length > 0 ? (
          <section className="mq-section">
            <div className="mq-section-head">
              <div>
                <p className="mq-section-kicker">Selección</p>
                <h3>Productos destacados</h3>
              </div>
              <button className="mq-link-btn" type="button" onClick={() => navigate("/explore")}>
                Ver más
              </button>
            </div>

            <div className="mq-featured-row">
              {featuredProducts.slice(0, 3).map((product) => (
                <article key={product.id} className="mq-featured-card" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                  <div className="mq-featured-overlay">
                    <span className="mq-badge">{product.condition || "Disponible"}</span>
                    <button
                      className={`mq-fav-btn ${favorites.includes(product.id) ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      aria-label="Guardar producto"
                      type="button"
                    >
                      {favorites.includes(product.id) ? "❤" : "♡"}
                    </button>
                  </div>
                  <div className="mq-featured-info">
                    <p className="mq-product-category">{product.category || "General"}</p>
                    <h4>{product.title}</h4>
                    <strong>{priceLabel(product.price)}</strong>
                    <span>{product.location || "Sin ubicación"}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mq-section mq-last-section">
          <div className="mq-section-head">
            <div>
              <p className="mq-section-kicker">Marketplace</p>
              <h3>Productos para ti</h3>
            </div>
            <button className="mq-filter-btn" type="button" onClick={() => navigate("/explore")}>
              Filtros
            </button>
          </div>

          {loading ? (
            <div className="mq-empty-state">
              <h4>Cargando productos...</h4>
              <p>Estamos trayendo el catálogo desde tu backend.</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="mq-empty-state">
              <h4>Error al cargar productos</h4>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mq-empty-state">
              <h4>No encontramos productos</h4>
              <p>Prueba con otra búsqueda o selecciona otra categoría.</p>
            </div>
          ) : (
            <div className="mq-products-grid">
              {filtered.map((product) => (
                <article key={product.id} className="mq-product-card" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="mq-product-image-wrap">
                    <img src={resolveImageSrc(product.imageUrl)} alt={product.title} />
                    <span className="mq-badge">{product.condition || "Disponible"}</span>
                    <button
                      className={`mq-fav-btn small ${favorites.includes(product.id) ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      aria-label="Guardar producto"
                      type="button"
                    >
                      {favorites.includes(product.id) ? "❤" : "♡"}
                    </button>
                  </div>

                  <div className="mq-product-info">
                    <p className="mq-product-category">{product.category || "General"}</p>
                    <h4>{product.title}</h4>
                    <div className="mq-product-bottom">
                      <strong>{priceLabel(product.price)}</strong>
                      <span>{product.location || "Sin ubicación"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
