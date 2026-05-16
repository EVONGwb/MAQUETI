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
  const [activeImage, setActiveImage] = useState(0);

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
  const images = useMemo(() => {
    if (!product) return [];
    const arr = Array.isArray(product.imageUrls) ? product.imageUrls : [];
    const list = arr.filter((u) => typeof u === "string" && u.trim());
    if (list.length) return list;
    if (product.imageUrl) return [product.imageUrl];
    return [];
  }, [product]);
  const sellerInitials = useMemo(() => {
    const name = String(product?.sellerName || "Vendedor").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "V";
    const b = parts[1]?.[0] || parts[0]?.[1] || "D";
    return `${a}${b}`.toUpperCase();
  }, [product?.sellerName]);

  useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

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
      <main className="pd-main">
        <div className="pd-inline-nav">
          <button className="pd-back-btn" onClick={() => navigate(-1)} type="button">
            ← Volver
          </button>
        </div>

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
              <div className="pd-gallery-badge">Publicado en MAQUETI</div>
              <img src={resolveImageSrc(images[activeImage] || product.imageUrl)} alt={product.title} className="pd-main-image" />
              {images.length > 1 ? (
                <div className="pd-thumbs" role="list">
                  {images.map((src, idx) => (
                    <button
                      key={`${src}_${idx}`}
                      className={`pd-thumb ${idx === activeImage ? "active" : ""}`}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      style={{ backgroundImage: `url(${resolveImageSrc(src)})` }}
                      aria-label={`Foto ${idx + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </section>

            <section className="pd-info-card">
              <p className="pd-category">
                {product.category ? (product.subcategory ? `${product.category} > ${product.subcategory}` : product.category) : "General"}
              </p>
              <h2>{product.title}</h2>
              <div className="pd-price">{priceLabel(product.price)}</div>

              <div className="pd-meta">
                <span>📍 {product.location || "Sin ubicación"}</span>
                <span>🏷 {product.condition || "Disponible"}</span>
                <span>⚡ Chat directo</span>
              </div>

              <p className="pd-description">{product.description || "Sin descripción"}</p>

              <div className="pd-trust-row">
                <div>
                  <strong>Compra con calma</strong>
                  <span>Habla, negocia y revisa el producto antes de cerrar el trato.</span>
                </div>
                <div>
                  <strong>Oferta rápida</strong>
                  <span>Pregunta disponibilidad y acuerda entrega desde el chat.</span>
                </div>
              </div>

              <div className="pd-seller-box">
                <div className="pd-seller-avatar">{sellerInitials}</div>
                <div>
                  <h4>{product.sellerName || "Vendedor"}</h4>
                  <p>Vendedor activo en MAQUETI</p>
                </div>
                <button type="button" onClick={handleContactSeller}>Contactar</button>
              </div>

              <div className="pd-actions">
                <button className="pd-chat-btn" onClick={handleContactSeller} type="button">
                  💬 Hablar con el vendedor
                </button>
                <button className="pd-buy-btn" type="button" onClick={handleContactSeller}>
                  Hacer oferta
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
