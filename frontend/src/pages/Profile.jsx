import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Fingerprint, LogOut, Store as StoreIcon, Trash2, Pencil, Save, X } from "lucide-react";
import CategorySelector from "../components/CategorySelector.jsx";
import { deleteProduct, resolveImageSrc, updateProduct } from "../services/api";
import { priceLabel } from "../services/format";

export default function ProfilePage({ user, myProducts, token, refreshData, onLogout, onRegisterPasskey, passkeyMessage }) {
  const navigate = useNavigate();
  const list = Array.isArray(myProducts) ? myProducts : [];
  const storeActive = user?.storeSubscriptionStatus === "active";
  const freeLimit = 10;
  const activeCount = useMemo(() => list.filter((p) => (p?.status || "published") !== "archived").length, [list]);
  const remaining = storeActive ? null : Math.max(0, freeLimit - activeCount);

  const normalizeCategory = (category, subcategory) => {
    const rawCat = String(category || "").trim();
    const rawSub = String(subcategory || "").trim();
    if (rawSub) return { category: rawCat || "Otros", subcategory: rawSub };
    if (rawCat.includes(" / ")) {
      const [c, s] = rawCat.split(" / ");
      return { category: String(c || "").trim() || "Otros", subcategory: String(s || "").trim() };
    }
    if (rawCat.includes(" > ")) {
      const [c, s] = rawCat.split(" > ");
      return { category: String(c || "").trim() || "Otros", subcategory: String(s || "").trim() };
    }
    return { category: rawCat || "Otros", subcategory: "" };
  };

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    condition: "",
    location: "",
    description: "",
    sku: "",
    imageUrl: "",
  });
  const [busyId, setBusyId] = useState(null);

  const openEdit = (p) => {
    const normalized = normalizeCategory(p.category, p.subcategory);
    setEditingId(p.id);
    setDraft({
      title: p.title || "",
      price: p.price === undefined || p.price === null ? "" : String(p.price),
      stock: p.stock === undefined || p.stock === null ? "" : String(p.stock),
      category: normalized.category,
      subcategory: normalized.subcategory,
      condition: p.condition || "Como nuevo",
      location: p.location || "",
      description: p.description || "",
      sku: p.sku || "",
      imageUrl: p.imageUrl || "",
    });
  };

  const closeEdit = () => {
    setEditingId(null);
  };

  const doRefresh = async () => {
    if (token && user?.id) await refreshData(token, user);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setBusyId(editingId);
    try {
      const payload = {
        title: String(draft.title || "").trim(),
        price: draft.price === "" ? undefined : Number(draft.price),
        stock: draft.stock === "" ? null : Number(draft.stock),
        category: String(draft.category || "Otros").trim() || "Otros",
        subcategory: String(draft.subcategory || "").trim() || null,
        condition: String(draft.condition || "Como nuevo").trim() || "Como nuevo",
        location: String(draft.location || "").trim() || null,
        description: String(draft.description || "").trim() || null,
        sku: String(draft.sku || "").trim() || null,
        imageUrl: String(draft.imageUrl || "").trim() || null,
      };
      await updateProduct(editingId, token, payload);
      await doRefresh();
      closeEdit();
    } finally {
      setBusyId(null);
    }
  };

  const removeOne = async (id) => {
    const ok = window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.");
    if (!ok) return;
    setBusyId(id);
    try {
      await deleteProduct(id, token);
      await doRefresh();
      if (editingId === id) closeEdit();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="view-container">
      <h2>Perfil</h2>

      <div className="empty-state" style={{ textAlign: "left" }}>
        <h4 style={{ marginBottom: 6 }}>{user?.name || "Usuario"}</h4>
        <p style={{ margin: 0 }}>{user?.email || ""}</p>
      </div>

      <div className="store-stats">
        <div className="stat-box">
          <p>Publicados</p>
          <h3>{activeCount}</h3>
        </div>
        <div className="stat-box">
          <p>{storeActive ? "Límite" : "Te quedan"}</p>
          <h3>{storeActive ? "∞" : remaining}</h3>
        </div>
        <div className="stat-box">
          <p>Plan tienda</p>
          <h3>{user?.storeSubscriptionStatus === "active" ? "Activo" : "Free"}</h3>
        </div>
      </div>

      <div className="btn-row">
        <button className="secondary-btn" type="button" onClick={() => navigate("/store")}>
          <StoreIcon size={18} /> Mi Tienda
        </button>
        <button className="secondary-btn" type="button" onClick={onRegisterPasskey}>
          <Fingerprint size={18} /> Activar huella
        </button>
        <button className="logout-btn" type="button" onClick={onLogout}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>

      {passkeyMessage ? <div className="msg">{passkeyMessage}</div> : null}

      <div className="empty-state" style={{ textAlign: "left", marginTop: 14 }}>
        <h4 style={{ marginBottom: 6 }}>Mis productos</h4>
        <p style={{ margin: 0 }}>{storeActive ? "Tienda activa: puedes publicar sin límite." : `Límite Free: ${freeLimit}. Te quedan ${remaining}.`}</p>
      </div>

      {list.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 12 }}>Aún no tienes productos publicados.</div>
      ) : (
        <div className="inventory-list" style={{ marginTop: 12 }}>
          {list.map((p) => (
            <div key={p.id} className="inventory-item" style={{ alignItems: "stretch", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="placeholder-img" style={{ width: 64, height: 64, borderRadius: 12, flex: "0 0 auto", backgroundImage: `url(${resolveImageSrc(p.imageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="inv-info" style={{ minWidth: 0 }}>
                  <h4 style={{ marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</h4>
                  <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(() => {
                      const normalized = normalizeCategory(p.category, p.subcategory);
                      const catLabel = normalized.subcategory ? `${normalized.category} > ${normalized.subcategory}` : normalized.category;
                      return `${priceLabel(p.price)} · ${catLabel}`;
                    })()}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="secondary-btn" type="button" disabled={busyId === p.id} onClick={() => openEdit(p)}>
                  <Pencil size={18} /> Editar
                </button>
                <button className="logout-btn" type="button" disabled={busyId === p.id} onClick={() => removeOne(p.id)}>
                  <Trash2 size={18} /> Eliminar
                </button>
              </div>

              {editingId === p.id ? (
                <div className="add-form" style={{ marginTop: 10 }}>
                  <div className="row-inputs">
                    <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Título" />
                    <input value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} placeholder="Precio (€)" inputMode="decimal" />
                  </div>
                  <div className="row-inputs">
                    <input value={draft.stock} onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))} placeholder="Stock" inputMode="numeric" />
                    <input value={draft.sku} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} placeholder="SKU (opcional)" />
                  </div>
                  <div className="row-inputs">
                    <CategorySelector
                      value={{ category: draft.category, subcategory: draft.subcategory }}
                      onChange={({ category: c, subcategory: s }) => setDraft((d) => ({ ...d, category: c || "Otros", subcategory: s || "" }))}
                      placeholder="Categoría"
                    />
                    <input value={draft.condition} onChange={(e) => setDraft((d) => ({ ...d, condition: e.target.value }))} placeholder="Condición" />
                  </div>
                  <input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} placeholder="Ubicación (opcional)" />
                  <input value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} placeholder="URL imagen (opcional)" />
                  <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Descripción (opcional)" />

                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <button className="secondary-btn" type="button" disabled={busyId === p.id} onClick={saveEdit}>
                      <Save size={18} /> Guardar
                    </button>
                    <button className="secondary-btn" type="button" disabled={busyId === p.id} onClick={closeEdit}>
                      <X size={18} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
