import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyStore, upsertMyStore, updateProduct } from "../services/api";
import { priceLabel } from "../services/format";

const statusLabel = (s) => {
  const v = String(s || "published");
  if (v === "draft") return "Borrador";
  if (v === "published") return "Publicado";
  if (v === "hidden") return "Oculto";
  if (v === "sold_out") return "Agotado";
  if (v === "archived") return "Archivado";
  return "Publicado";
};

export default function StoreHub({ token, user, myProducts, refreshData, onRequireAuth }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [lockedByAdmin, setLockedByAdmin] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard");

  const [form, setForm] = useState({
    name: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    themePrimary: "#2563eb",
    themeAccent: "#0f172a",
    themeBackground: "#ffffff",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      setNeedsSubscription(false);
      setLockedByAdmin(false);
      try {
        if (!token) {
          onRequireAuth?.("Regístrate o inicia sesión para gestionar tu tienda.");
          return;
        }
        const data = await fetchMyStore(token);
        if (cancelled) return;
        setStore(data.store || null);
        if (data.store) {
          setForm((prev) => ({
            ...prev,
            name: data.store.name || "",
            description: data.store.description || "",
            logoUrl: data.store.logoUrl || "",
            bannerUrl: data.store.bannerUrl || "",
            themePrimary: data.store.themePrimary || "#2563eb",
            themeAccent: data.store.themeAccent || "#0f172a",
            themeBackground: data.store.themeBackground || "#ffffff",
          }));
        }
      } catch (e) {
        if (cancelled) return;
        if (e?.status === 401) {
          onRequireAuth?.("Regístrate o inicia sesión para gestionar tu tienda.");
          return;
        }
        if (e?.status === 402 || e?.code === "STORE_SUBSCRIPTION_REQUIRED") {
          setNeedsSubscription(true);
          return;
        }
        if (e?.status === 403 || e?.code === "STORE_SUBSCRIPTION_LOCKED") {
          setLockedByAdmin(true);
          return;
        }
        if (e?.status === 404) {
          setStore(null);
          return;
        }
        setError(e?.message || "No se pudo cargar la tienda");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const saveStore = async () => {
    setError("");
    try {
      const data = await upsertMyStore(token, form);
      setStore(data.store);
      setTab("dashboard");
    } catch (e) {
      if (e?.status === 402 || e?.code === "STORE_SUBSCRIPTION_REQUIRED") {
        setNeedsSubscription(true);
        return;
      }
      if (e?.status === 403 || e?.code === "STORE_SUBSCRIPTION_LOCKED") {
        setLockedByAdmin(true);
        return;
      }
      setError(e?.message || "No se pudo guardar la tienda");
    }
  };

  const productsByStatus = useMemo(() => {
    const list = Array.isArray(myProducts) ? myProducts : [];
    const counts = { draft: 0, published: 0, hidden: 0, sold_out: 0, archived: 0 };
    list.forEach((p) => {
      const s = String(p.status || "published");
      if (counts[s] === undefined) counts.published += 1;
      else counts[s] += 1;
    });
    return counts;
  }, [myProducts]);

  const updateOneProduct = async (productId, patch) => {
    setError("");
    try {
      await updateProduct(productId, token, patch);
      await refreshData(token, user);
    } catch (e) {
      if (e?.message) setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="view-container">
        <h2>Mi Tienda</h2>
        <div className="empty-state">Cargando…</div>
      </div>
    );
  }

  if (needsSubscription) {
    return (
      <div className="view-container">
        <h2>Activa tu Tienda</h2>
        <div className="empty-state">
          <h4>Modo Tienda (suscripción)</h4>
          <p>Crea tu tienda, personalízala, controla stock y publica productos con estados.</p>
        </div>
        <div className="btn-row">
          <button className="primary-btn" type="button" onClick={() => navigate("/explore")}>
            Ver planes
          </button>
          <button className="secondary-btn" type="button" onClick={() => navigate("/")}>
            Ahora no
          </button>
        </div>
      </div>
    );
  }

  if (lockedByAdmin) {
    return (
      <div className="view-container">
        <h2>Modo Tienda</h2>
        <div className="empty-state">
          <h4>Activación reservada</h4>
          <p>La activación de pagos (Stripe/PayPal) está bloqueada hasta que el admin la habilite.</p>
        </div>
        <div className="btn-row">
          <button className="primary-btn" type="button" onClick={() => navigate("/")}>
            Entendido
          </button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="view-container">
        <h2>Crea tu Tienda</h2>
        {error ? <div className="msg">{error}</div> : null}
        <div className="add-form">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de la tienda" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción" />
          <div className="row-inputs">
            <input value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="URL del logo" />
            <input value={form.bannerUrl} onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))} placeholder="URL del banner" />
          </div>
          <div className="row-inputs">
            <input value={form.themePrimary} onChange={(e) => setForm((p) => ({ ...p, themePrimary: e.target.value }))} placeholder="Color primario (#2563eb)" />
            <input value={form.themeAccent} onChange={(e) => setForm((p) => ({ ...p, themeAccent: e.target.value }))} placeholder="Color acento (#0f172a)" />
          </div>
          <input value={form.themeBackground} onChange={(e) => setForm((p) => ({ ...p, themeBackground: e.target.value }))} placeholder="Color fondo (#ffffff)" />
          <button className="primary-btn" type="button" onClick={saveStore}>
            Crear tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {error ? <div className="msg">{error}</div> : null}

      <div className="store-header" style={{ margin: 0, borderRadius: 24, overflow: "hidden" }}>
        <div
          className="store-banner placeholder-img"
          style={store.bannerUrl ? { backgroundImage: `url(${store.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />
        <div className="store-profile">
          <div
            className="store-avatar"
            style={store.logoUrl ? { backgroundImage: `url(${store.logoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          />
          <div>
            <h2>{store.name}</h2>
            <p>{user?.email || ""}</p>
          </div>
        </div>
      </div>

      <div className="store-stats">
        <div className="stat-box">
          <p>Productos</p>
          <h3>{myProducts.length}</h3>
        </div>
        <div className="stat-box">
          <p>Publicados</p>
          <h3>{productsByStatus.published}</h3>
        </div>
        <div className="stat-box">
          <p>Borrador</p>
          <h3>{productsByStatus.draft}</h3>
        </div>
      </div>

      <div className="store-tabs">
        <span className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
          Panel
        </span>
        <span className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>
          Diseño
        </span>
        <span className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>
          Productos
        </span>
        <span className={tab === "public" ? "active" : ""} onClick={() => setTab("public")}>
          Pública
        </span>
      </div>

      {tab === "dashboard" ? (
        <div className="empty-state">
          <h4>Tu negocio en MAQUETI</h4>
          <p>Gestiona productos, controla stock y publica cuando quieras.</p>
        </div>
      ) : null}

      {tab === "design" ? (
        <div className="add-form">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de la tienda" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción" />
          <div className="row-inputs">
            <input value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="URL del logo" />
            <input value={form.bannerUrl} onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))} placeholder="URL del banner" />
          </div>
          <div className="row-inputs">
            <input value={form.themePrimary} onChange={(e) => setForm((p) => ({ ...p, themePrimary: e.target.value }))} placeholder="Color primario" />
            <input value={form.themeAccent} onChange={(e) => setForm((p) => ({ ...p, themeAccent: e.target.value }))} placeholder="Color acento" />
          </div>
          <input value={form.themeBackground} onChange={(e) => setForm((p) => ({ ...p, themeBackground: e.target.value }))} placeholder="Color fondo" />
          <button className="primary-btn" type="button" onClick={saveStore}>
            Guardar cambios
          </button>
        </div>
      ) : null}

      {tab === "products" ? (
        myProducts.length === 0 ? (
          <div className="empty-state">Aún no tienes productos. Publica tu primer producto.</div>
        ) : (
          <div className="inventory-list">
            {myProducts.map((p) => (
              <div key={p.id} className="inventory-item">
                <div className="inv-info">
                  <h4>{p.title}</h4>
                  <p>{priceLabel(p.price)} · {statusLabel(p.status)}</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select value={p.status || "published"} onChange={(e) => updateOneProduct(p.id, { status: e.target.value })}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="hidden">Oculto</option>
                    <option value="sold_out">Agotado</option>
                    <option value="archived">Archivado</option>
                  </select>
                  <input
                    style={{ width: 88 }}
                    type="number"
                    placeholder="Stock"
                    defaultValue={p.stock ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value;
                      updateOneProduct(p.id, { stock: v === "" ? null : Number(v) });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "public" ? (
        <div className="empty-state">
          <h4>Vista pública</h4>
          <p>Solo los productos en estado Publicado serán visibles.</p>
          <button className="primary-btn" type="button" onClick={() => navigate(`/shop/${store.slug}`)}>
            Abrir mi tienda pública
          </button>
        </div>
      ) : null}
    </div>
  );
}
