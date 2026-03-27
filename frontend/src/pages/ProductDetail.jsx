import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart } from "lucide-react";
import { getApiUrl, parseJsonResponse, resolveImageSrc } from "../services/api";
import { priceLabel } from "../services/format";

export default function ProductDetailPage({ products, toggleFavorite, favorites, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p) => String(p.id) === String(id));
  const [contactMessage, setContactMessage] = useState("");

  if (!product) {
    return (
      <div className="view-container">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </div>
        <div className="empty-state" style={{ marginTop: "60px" }}>
          Producto no encontrado
        </div>
      </div>
    );
  }

  const isFav = favorites.includes(product.id);

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
    <div className="product-detail-view">
      <div className="product-detail-image" style={{ backgroundImage: `url(${resolveImageSrc(product.imageUrl)})` }}>
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </div>
      </div>

      <div className="product-detail-content">
        <p className="product-detail-price">{priceLabel(product.price)}</p>
        <h2 className="product-detail-title">{product.title}</h2>

        <div className="product-detail-meta">
          <span className="tag new">{product.condition || "—"}</span>
          <span className="tag zone">{product.category || "Otros"}</span>
          {product.location && <span className="tag zone">{product.location}</span>}
        </div>

        <h3>Descripción</h3>
        <p className="product-detail-desc">{product.description || "El vendedor no ha añadido una descripción para este producto."}</p>

        {product.stock !== null && product.stock !== undefined && (
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Stock disponible: <strong>{product.stock}</strong> unidades
          </p>
        )}

        <div className="action-bar">
          <button className="chat-btn" onClick={handleContactSeller}>
            Contactar vendedor
          </button>
          <button
            className="chat-btn"
            style={{ background: isFav ? "#ff5a00" : "#fff", color: isFav ? "#fff" : "#ff5a00", border: "1px solid #ff5a00", transition: "all 0.2s" }}
            onClick={() => toggleFavorite(product.id)}
            type="button"
          >
            <Heart size={20} fill={isFav ? "white" : "none"} />
          </button>
        </div>
        {contactMessage ? (
          <div className="error" style={{ marginTop: "12px" }}>
            {contactMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
