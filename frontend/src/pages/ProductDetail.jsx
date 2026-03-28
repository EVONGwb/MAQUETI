import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiUrl, parseJsonResponse, resolveImageSrc, fetchProductById } from "../services/api";
import { priceLabel } from "../services/format";

export default function ProductDetailPage({ products, toggleFavorite, favorites, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const productFromList = useMemo(() => products.find((p) => String(p.id) === String(id)) || null, [products, id]);
  const [product, setProduct] = useState(productFromList);
  const [loading, setLoading] = useState(!productFromList);
  const [error, setError] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    if (productFromList) {
      setProduct(productFromList);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProductById(id);
        if (cancelled) return;
        setProduct(data?.product || null);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "No se pudo cargar el producto");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, productFromList]);

  const isFav = product ? favorites.includes(product.id) : false;

  const handleContactSeller = async () => {
    setContactMessage("");
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem("token") || "";
      if (!token) {
        onRequireAuth?.();
        return;
      }

      const res = await fetch(`${apiUrl}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.message || "No se pudo iniciar la conversación");

      navigate(`/chats/${data.conversation.id}`);
    } catch (e) {
      if (e?.nonJson) {
        setContactMessage("Respuesta inesperada del servidor. Revisa que VITE_API_URL apunte al backend.");
      } else {
        setContactMessage(e?.message || "No se pudo contactar con el vendedor");
      }
    }
  };

  return (
    <div className="pd-page">
      <header className="pd-topbar">
        <button className="pd-back-btn" onClick={() => navigate(-1)} type="button">
          ← Volver
        </button>
        <h1>Detalle del producto</h1>
        <div className="pd-spacer" />
      </header>

      <main className="pd-main">
        {loading ? (
          <div className="pd-state-card">
            <h3>Cargando producto...</h3>
          </div>
        ) : error ? (
          <div className="pd-state-card">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        ) : product ? (
          <div className="pd-grid">
            <section className="pd-gallery-card">
              <img src={resolveImageSrc(product.imageUrl)} alt={product.title} className="pd-main-image" />
            </section>

            <section className="pd-info-card">
              <p className="pd-category">{product.category || "General"}</p>
              <h2>{product.title}</h2>
              <div className="pd-price">{priceLabel(product.price)}</div>

              <div className="pd-meta">
                <span>📍 {product.location || "Sin ubicación"}</span>
                <span>🏷 {product.condition || "Disponible"}</span>
              </div>

              <p className="pd-description">{product.description || "Sin descripción"}</p>

              <div className="pd-seller-box">
                <h4>Vendedor</h4>
                <p>{product.sellerName || "Vendedor"}</p>
              </div>

              <div className="pd-actions">
                <button className="pd-chat-btn" onClick={handleContactSeller} type="button">
                  💬 Hablar con el vendedor
                </button>
                <button className="pd-buy-btn" type="button" disabled>
                  Comprar ahora
                </button>
              </div>

              <div className="pd-actions">
                <button
                  className={`pd-fav-btn ${isFav ? "active" : ""}`}
                  onClick={() => toggleFavorite(product.id)}
                  type="button"
                >
                  {isFav ? "❤ Guardado" : "♡ Guardar"}
                </button>
              </div>

              {contactMessage ? (
                <div className="pd-state-card" style={{ marginTop: "16px" }}>
                  <p>{contactMessage}</p>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
