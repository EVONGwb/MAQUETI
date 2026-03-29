import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyStore, resolveImageSrc, uploadImageToCloudinary, uploadMyStoreAsset, upsertMyStore, updateProduct } from "../services/api";
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
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [lockedByAdmin, setLockedByAdmin] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard");

  const [form, setForm] = useState({
    name: "",
    description: "",
    welcomeMessage: "",
    logoUrl: "",
    bannerUrl: "",
    themePrimary: "#2563eb",
    themeAccent: "#0f172a",
    themeBackground: "#ffffff",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

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
            welcomeMessage: data.store.welcomeMessage || "",
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

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview("");
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [bannerFile]);

  const normalizeHex = (value, fallback) => {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    const ok = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v);
    return ok ? v.toLowerCase() : fallback;
  };

  const saveStore = async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      if (!form.name || !String(form.name).trim()) {
        setError("El nombre de la tienda es obligatorio.");
        return;
      }

      let logoUrl = form.logoUrl || "";
      let bannerUrl = form.bannerUrl || "";

      if (logoFile) {
        if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
          logoUrl = await uploadImageToCloudinary(logoFile, { folder: "maqueti/store" });
        } else {
          const up = await uploadMyStoreAsset(token, logoFile, "logo");
          logoUrl = up?.url || logoUrl;
        }
      }
      if (bannerFile) {
        if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
          bannerUrl = await uploadImageToCloudinary(bannerFile, { folder: "maqueti/store" });
        } else {
          const up = await uploadMyStoreAsset(token, bannerFile, "banner");
          bannerUrl = up?.url || bannerUrl;
        }
      }

      if (!logoUrl) {
        setError("Sube un logo para que tu tienda se vea profesional.");
        return;
      }
      if (!bannerUrl) {
        setError("Sube un banner: es la primera impresión de tu tienda.");
        return;
      }

      const payload = {
        ...form,
        logoUrl,
        bannerUrl,
        themePrimary: normalizeHex(form.themePrimary, "#2563eb"),
        themeAccent: normalizeHex(form.themeAccent, "#0f172a"),
        themeBackground: normalizeHex(form.themeBackground, "#ffffff"),
      };

      const data = await upsertMyStore(token, payload);
      setStore(data.store);
      setForm((p) => ({
        ...p,
        logoUrl: data?.store?.logoUrl || logoUrl,
        bannerUrl: data?.store?.bannerUrl || bannerUrl,
      }));
      setLogoFile(null);
      setBannerFile(null);
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
    } finally {
      setSaving(false);
    }
  };

  const bannerSrc = bannerPreview || (form.bannerUrl ? resolveImageSrc(form.bannerUrl) : "");
  const logoSrc = logoPreview || (form.logoUrl ? resolveImageSrc(form.logoUrl) : "");

  const steps = useMemo(() => {
    const okName = Boolean(String(form.name || "").trim());
    const okImages = Boolean((logoFile || form.logoUrl) && (bannerFile || form.bannerUrl));
    const okDesc = Boolean(String(form.description || "").trim());
    const okColors = Boolean(String(form.themePrimary || "").trim() && String(form.themeAccent || "").trim());
    const score = [okName, okImages, okDesc, okColors].filter(Boolean).length;
    return { okName, okImages, okDesc, okColors, score };
  }, [form, logoFile, bannerFile]);

  const StoreDesigner = ({ mode }) => {
    return (
      <div className="store-create">
        <div className="store-create-hero">
          <div>
            <h2>{mode === "create" ? "Crea tu Tienda" : "Diseña tu Tienda"}</h2>
            <p>{mode === "create" ? "Diseña tu marca y empieza a vender en MAQUETI." : "Ajusta tu identidad visual y tu perfil de tienda."}</p>
          </div>
          <div className="store-create-progress-wrap" aria-label="Progreso">
            <div className="store-create-progress">
              <div className="store-create-progress-bar" style={{ width: `${(steps.score / 4) * 100}%` }} />
            </div>
            <div className="store-create-progress-meta">{`${steps.score}/4 listo`}</div>
          </div>
        </div>

        {error ? <div className="msg">{error}</div> : null}

        <div className="store-create-grid">
          <div className="store-preview">
            <div className="store-preview-card" style={{ background: normalizeHex(form.themeBackground, "#ffffff") }}>
              <div
                className="store-preview-banner"
                style={
                  bannerSrc
                    ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(15,23,42,0.15))" }
                }
              />
              <div className="store-preview-body">
                <div
                  className="store-preview-logo"
                  style={
                    logoSrc
                      ? { backgroundImage: `url(${logoSrc})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: normalizeHex(form.themePrimary, "#2563eb") }
                  }
                />
                <div className="store-preview-title" style={{ color: normalizeHex(form.themeAccent, "#0f172a") }}>
                  {String(form.name || "").trim() || "Mi Tienda"}
                </div>
                <div className="store-preview-text">{String(form.welcomeMessage || "").trim() || "Bienvenidos a mi tienda online."}</div>
                <div className="store-preview-sub">{String(form.description || "").trim() || "Aquí encontrarás productos al mejor precio."}</div>
              </div>
            </div>
            <div className="store-preview-hint">Vista previa en tiempo real</div>
          </div>

          <div className="store-create-form">
            <div className="store-block">
              <div className="store-block-head">
                <h3>Identidad de la tienda</h3>
                <p>El nombre y el mensaje ayudan a que tu marca se recuerde.</p>
              </div>
              <div className="store-field">
                <label>Nombre de la tienda</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Evongo Store" />
              </div>
              <div className="store-field">
                <label>Mensaje de bienvenida (opcional)</label>
                <input value={form.welcomeMessage} onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))} placeholder="Ej: Envíos rápidos y atención premium" />
              </div>
            </div>

            <div className="store-block">
              <div className="store-block-head">
                <h3>Imágenes de la tienda</h3>
                <p>Un buen logo y banner elevan tu tienda al instante.</p>
              </div>

              <div className="store-upload-row">
                <div className="store-upload">
                  <div className="store-upload-label">Logo</div>
                  <label className="store-upload-card">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                    <div
                      className="store-upload-preview"
                      style={
                        logoSrc
                          ? { backgroundImage: `url(${logoSrc})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : { background: "rgba(15, 23, 42, 0.05)" }
                      }
                    />
                    <div className="store-upload-cta">{logoSrc ? "Cambiar logo" : "Subir logo"}</div>
                  </label>
                  {logoSrc ? (
                    <button
                      className="store-upload-remove"
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setForm((p) => ({ ...p, logoUrl: "" }));
                      }}
                    >
                      Quitar
                    </button>
                  ) : (
                    <div className="store-upload-hint">Un logo profesional genera confianza.</div>
                  )}
                </div>

                <div className="store-upload">
                  <div className="store-upload-label">Banner</div>
                  <label className="store-upload-card">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                    <div
                      className="store-upload-preview store-upload-preview-banner"
                      style={
                        bannerSrc
                          ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : { background: "rgba(15, 23, 42, 0.05)" }
                      }
                    />
                    <div className="store-upload-cta">{bannerSrc ? "Cambiar banner" : "Subir banner"}</div>
                  </label>
                  {bannerSrc ? (
                    <button
                      className="store-upload-remove"
                      type="button"
                      onClick={() => {
                        setBannerFile(null);
                        setForm((p) => ({ ...p, bannerUrl: "" }));
                      }}
                    >
                      Quitar
                    </button>
                  ) : (
                    <div className="store-upload-hint">El banner es tu primera impresión.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="store-block">
              <div className="store-block-head">
                <h3>Descripción</h3>
                <p>Cuenta qué vendes y por qué tu tienda es especial.</p>
              </div>
              <div className="store-field">
                <label>Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Tecnología, moda y ofertas exclusivas cada semana." />
              </div>
            </div>

            <div className="store-block">
              <div className="store-block-head">
                <h3>Estilo visual</h3>
                <p>Personaliza tus colores y verás el cambio en la vista previa.</p>
              </div>

              <div className="store-color-grid">
                <div className="store-color">
                  <div className="store-color-label">Color principal</div>
                  <div className="store-color-row">
                    <input type="color" value={normalizeHex(form.themePrimary, "#2563eb")} onChange={(e) => setForm((p) => ({ ...p, themePrimary: e.target.value }))} />
                    <input value={form.themePrimary} onChange={(e) => setForm((p) => ({ ...p, themePrimary: e.target.value }))} placeholder="#2563eb" />
                  </div>
                </div>
                <div className="store-color">
                  <div className="store-color-label">Color secundario</div>
                  <div className="store-color-row">
                    <input type="color" value={normalizeHex(form.themeAccent, "#0f172a")} onChange={(e) => setForm((p) => ({ ...p, themeAccent: e.target.value }))} />
                    <input value={form.themeAccent} onChange={(e) => setForm((p) => ({ ...p, themeAccent: e.target.value }))} placeholder="#0f172a" />
                  </div>
                </div>
                <div className="store-color">
                  <div className="store-color-label">Color de fondo</div>
                  <div className="store-color-row">
                    <input type="color" value={normalizeHex(form.themeBackground, "#ffffff")} onChange={(e) => setForm((p) => ({ ...p, themeBackground: e.target.value }))} />
                    <input value={form.themeBackground} onChange={(e) => setForm((p) => ({ ...p, themeBackground: e.target.value }))} placeholder="#ffffff" />
                  </div>
                </div>
              </div>
            </div>

            <div className="store-cta">
              <button className="primary-btn store-cta-btn" type="button" disabled={saving} onClick={saveStore}>
                {saving ? "Creando…" : mode === "create" ? "Crear mi tienda" : "Guardar cambios"}
              </button>
              <div className="store-cta-hint">Revisaremos tus datos y podrás editarlo después.</div>
            </div>
          </div>
        </div>
      </div>
    );
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
        <StoreDesigner mode="create" />
      </div>
    );
  }

  return (
    <div className="view-container">
      {error ? <div className="msg">{error}</div> : null}

      <div className="store-header" style={{ margin: 0, borderRadius: 24, overflow: "hidden" }}>
        <div
          className="store-banner placeholder-img"
          style={store.bannerUrl ? { backgroundImage: `url(${resolveImageSrc(store.bannerUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />
        <div className="store-profile">
          <div
            className="store-avatar"
            style={store.logoUrl ? { backgroundImage: `url(${resolveImageSrc(store.logoUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
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
        <StoreDesigner mode="edit" />
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
