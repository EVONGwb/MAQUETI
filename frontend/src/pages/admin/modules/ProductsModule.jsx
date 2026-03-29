import React, { useEffect, useMemo, useState } from "react";
import { adminDeleteProduct, adminFetchProducts, adminUpdateProduct } from "../../../services/api.js";
import { priceLabel } from "../../../services/format.js";

export default function ProductsModule({ token }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => products.find((p) => String(p.id) === String(selectedId)) || null, [products, selectedId]);

  const [draft, setDraft] = useState({
    title: "",
    price: "",
    stock: "",
    status: "published",
    category: "",
    subcategory: "",
    condition: "",
    location: "",
    imageUrl: "",
    description: "",
  });

  const load = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminFetchProducts(token, { q: q || undefined, status: statusFilter || undefined });
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft({
      title: selected.title || "",
      price: selected.price === undefined || selected.price === null ? "" : String(selected.price),
      stock: selected.stock === undefined || selected.stock === null ? "" : String(selected.stock),
      status: selected.status || "published",
      category: selected.category || "Otros",
      subcategory: selected.subcategory || "",
      condition: selected.condition || "Como nuevo",
      location: selected.location || "",
      imageUrl: selected.imageUrl || "",
      description: selected.description || "",
    });
  }, [selectedId]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: draft.title,
        price: draft.price === "" ? undefined : Number(draft.price),
        stock: draft.stock === "" ? null : Number(draft.stock),
        status: draft.status,
        category: draft.category,
        subcategory: draft.subcategory || null,
        condition: draft.condition,
        location: draft.location || null,
        imageUrl: draft.imageUrl || null,
        description: draft.description || null,
      };
      const res = await adminUpdateProduct(selected.id, token, payload);
      const updated = res?.product || null;
      if (updated) setProducts((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
    } catch (e) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async () => {
    if (!selected) return;
    const ok = window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.");
    if (!ok) return;
    setSaving(true);
    setError("");
    try {
      await adminDeleteProduct(selected.id, token);
      setProducts((prev) => prev.filter((x) => String(x.id) !== String(selected.id)));
      setSelectedId(null);
    } catch (e) {
      setError(e?.message || "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-split">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Productos</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (título/categoría/SKU)" style={{ height: 44, borderRadius: 12, padding: "0 12px" }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">status: todos</option>
              <option value="published">published</option>
              <option value="draft">draft</option>
              <option value="hidden">hidden</option>
              <option value="sold_out">sold_out</option>
              <option value="archived">archived</option>
            </select>
            <button className="secondary-btn" type="button" disabled={loading || !token} onClick={load}>
              Recargar
            </button>
          </div>
        </div>

        {error ? <div className="admin-error">{error}</div> : null}
        {loading ? <div className="admin-muted">Cargando…</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Precio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={String(selectedId) === String(p.id) ? "active" : ""} onClick={() => setSelectedId(p.id)}>
                  <td>{p.id}</td>
                  <td>{p.title || "—"}</td>
                  <td>{priceLabel(p.price)}</td>
                  <td>{p.status || "published"}</td>
                </tr>
              ))}
              {!loading && products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-muted">
                    No hay productos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Edición</div>
        </div>

        {!selected ? (
          <div className="admin-muted">Selecciona un producto.</div>
        ) : (
          <div className="admin-form">
            <div className="admin-field">
              <div className="admin-label">Título</div>
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Status</div>
              <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                <option value="published">published</option>
                <option value="draft">draft</option>
                <option value="hidden">hidden</option>
                <option value="sold_out">sold_out</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="admin-field">
              <div className="admin-label">Precio</div>
              <input value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} inputMode="decimal" />
            </div>
            <div className="admin-field">
              <div className="admin-label">Stock</div>
              <input value={draft.stock} onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))} inputMode="numeric" />
            </div>
            <div className="admin-field">
              <div className="admin-label">Categoría</div>
              <input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Subcategoría</div>
              <input value={draft.subcategory} onChange={(e) => setDraft((d) => ({ ...d, subcategory: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Condición</div>
              <input value={draft.condition} onChange={(e) => setDraft((d) => ({ ...d, condition: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Ubicación</div>
              <input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Imagen URL</div>
              <input value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
            </div>
            <div className="admin-field">
              <div className="admin-label">Descripción</div>
              <input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <button className="primary-btn" type="button" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button className="logout-btn" type="button" disabled={saving} onClick={removeOne}>
              Eliminar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

