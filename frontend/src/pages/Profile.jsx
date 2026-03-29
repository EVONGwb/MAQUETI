import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Brush, Camera, Crown, Fingerprint, LogOut, Save, Store as StoreIcon, Trash2, Pencil, X } from "lucide-react";
import { deleteProduct, fetchMyProfile, resolveImageSrc, updateMyProfile, updateProduct } from "../services/api";
import { priceLabel } from "../services/format";

export default function ProfilePage({ user, myProducts, token, refreshData, onLogout, onRegisterPasskey, passkeyMessage }) {
  const navigate = useNavigate();
  const list = Array.isArray(myProducts) ? myProducts : [];
  const storeActive = user?.storeSubscriptionStatus === "active";
  const freeLimit = 10;
  const activeCount = useMemo(() => list.filter((p) => (p?.status || "published") !== "archived").length, [list]);
  const availableCount = useMemo(
    () =>
      list.filter((p) => {
        const st = p?.status || "published";
        if (st === "archived") return false;
        if (p?.stock === null || p?.stock === undefined || p?.stock === "") return true;
        const v = Number(p.stock);
        return Number.isFinite(v) ? v > 0 : true;
      }).length,
    [list]
  );
  const remaining = storeActive ? null : Math.max(0, freeLimit - activeCount);

  const categories = [
    "Tecnología",
    "Moda",
    "Hogar",
    "Motor",
    "Gaming",
    "Deporte",
    "Belleza",
    "Coleccionismo",
    "Niños",
    "Mascotas",
    "Servicios",
    "Otros",
  ];
  const subcategoryMap = {
    Tecnología: ["Móviles", "Ordenadores", "Consolas", "Audio", "TV y vídeo", "Accesorios", "Wearables", "Componentes", "Otros"],
    Moda: ["Hombre", "Mujer", "Niños", "Zapatos", "Bolsos", "Relojes", "Accesorios", "Otros"],
    Hogar: ["Muebles", "Decoración", "Cocina", "Electrodomésticos", "Jardín", "Limpieza", "Iluminación", "Otros"],
    Motor: ["Coches", "Motos", "Recambios", "Accesorios", "Neumáticos", "Herramientas", "Otros"],
    Gaming: ["Consolas", "Juegos", "PC Gaming", "Mandos", "Accesorios", "Coleccionables", "Otros"],
    Deporte: ["Fitness", "Fútbol", "Running", "Ciclismo", "Outdoor", "Natación", "Otros"],
    Belleza: ["Perfumes", "Maquillaje", "Cuidado facial", "Cuidado capilar", "Cuidado corporal", "Otros"],
    Coleccionismo: ["Trading Cards", "Figuras", "Vintage", "Comics", "Arte", "Monedas", "Otros"],
    Niños: ["Ropa", "Juguetes", "Carritos", "Sillas", "Higiene", "Otros"],
    Mascotas: ["Accesorios", "Alimentación", "Higiene", "Transportines", "Otros"],
    Servicios: ["Reparaciones", "Mudanzas", "Clases", "Eventos", "Otros"],
    Otros: ["General"],
  };

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

  const [profile, setProfile] = useState(() => ({
    name: user?.name || "Usuario",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    bannerUrl: user?.bannerUrl || "",
    themeColor: user?.themeColor || "#2563eb",
  }));
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(() => ({
    name: user?.name || "Usuario",
    avatarUrl: user?.avatarUrl || "",
    bannerUrl: user?.bannerUrl || "",
    themeColor: user?.themeColor || "#2563eb",
  }));
  const [profileBusy, setProfileBusy] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    setProfile((p) => ({
      ...p,
      name: user?.name || "Usuario",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || p.avatarUrl || "",
      bannerUrl: user?.bannerUrl || p.bannerUrl || "",
      themeColor: user?.themeColor || p.themeColor || "#2563eb",
    }));
    setProfileDraft((d) => ({
      ...d,
      name: user?.name || d.name || "Usuario",
      avatarUrl: user?.avatarUrl || d.avatarUrl || "",
      bannerUrl: user?.bannerUrl || d.bannerUrl || "",
      themeColor: user?.themeColor || d.themeColor || "#2563eb",
    }));
  }, [user?.name, user?.email, user?.avatarUrl, user?.bannerUrl, user?.themeColor]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const data = await fetchMyProfile(token);
        if (!alive) return;
        const u = data?.user;
        if (!u) return;
        const next = {
          name: u.name || profile.name,
          email: u.email || profile.email,
          avatarUrl: u.avatarUrl || "",
          bannerUrl: u.bannerUrl || "",
          themeColor: u.themeColor || "#2563eb",
        };
        setProfile(next);
        setProfileDraft({ name: next.name, avatarUrl: next.avatarUrl, bannerUrl: next.bannerUrl, themeColor: next.themeColor });
        try {
          localStorage.setItem("userName", next.name || "");
          localStorage.setItem("userAvatarUrl", next.avatarUrl || "");
          localStorage.setItem("userBannerUrl", next.bannerUrl || "");
          localStorage.setItem("userThemeColor", next.themeColor || "");
        } catch {
          undefined;
        }
      } catch {
        undefined;
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

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
      imageUrl: p.imageUrl || (Array.isArray(p.imageUrls) && p.imageUrls[0]) || "",
    });
  };

  const closeEdit = () => {
    setEditingId(null);
  };

  const doRefresh = async () => {
    if (token && user?.id) await refreshData(token, user);
  };

  const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
  const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim();

  const uploadImageToCloudinary = async (file) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary no está configurado");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Error subiendo imagen");
    return data.secure_url;
  };

  const openProfileEdit = () => {
    setProfileDraft({
      name: profile.name || "Usuario",
      avatarUrl: profile.avatarUrl || "",
      bannerUrl: profile.bannerUrl || "",
      themeColor: profile.themeColor || "#2563eb",
    });
    setEditProfileOpen(true);
  };

  const saveProfile = async () => {
    if (!token) return;
    setProfileBusy(true);
    try {
      const payload = {
        name: String(profileDraft.name || "").trim(),
        avatarUrl: profileDraft.avatarUrl ? String(profileDraft.avatarUrl).trim() : null,
        bannerUrl: profileDraft.bannerUrl ? String(profileDraft.bannerUrl).trim() : null,
        themeColor: profileDraft.themeColor ? String(profileDraft.themeColor).trim() : null,
      };
      const data = await updateMyProfile(token, payload);
      const u = data?.user;
      if (u) {
        const next = {
          name: u.name || payload.name || "Usuario",
          email: profile.email,
          avatarUrl: u.avatarUrl || "",
          bannerUrl: u.bannerUrl || "",
          themeColor: u.themeColor || payload.themeColor || "#2563eb",
        };
        setProfile(next);
        setEditProfileOpen(false);
        try {
          localStorage.setItem("userName", next.name || "");
          localStorage.setItem("userAvatarUrl", next.avatarUrl || "");
          localStorage.setItem("userBannerUrl", next.bannerUrl || "");
          localStorage.setItem("userThemeColor", next.themeColor || "");
        } catch {
          undefined;
        }
        await doRefresh();
      }
    } finally {
      setProfileBusy(false);
    }
  };

  const initials = useMemo(() => {
    const n = String(profile?.name || "Usuario").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [profile?.name]);

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
    <div className="view-container pf-root" style={{ ["--pf-accent"]: profile.themeColor || "#2563eb" }}>
      <div className="pf-banner" style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : {}}>
        <div className="pf-banner-shade" />
        <button className="pf-banner-edit" type="button" onClick={openProfileEdit}>
          <Brush size={16} /> Personalizar
        </button>
      </div>

      <div className="pf-identity">
        <div className="pf-avatar" style={profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : {}}>
          {!profile.avatarUrl ? <span className="pf-initials">{initials}</span> : null}
        </div>
        <div className="pf-user">
          <div className="pf-name">{profile.name || "Usuario"}</div>
          <div className="pf-email">{profile.email || ""}</div>
        </div>
        <button className="pf-edit" type="button" onClick={openProfileEdit}>
          <Pencil size={18} />
        </button>
      </div>

      <div className="pf-stats">
        <div className="pf-stat">
          <div className="pf-stat-icon">
            <BarChart3 size={18} />
          </div>
          <div className="pf-stat-meta">
            <div className="pf-stat-label">Publicados</div>
            <div className="pf-stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-icon">
            <Camera size={18} />
          </div>
          <div className="pf-stat-meta">
            <div className="pf-stat-label">Disponibles</div>
            <div className="pf-stat-value">{availableCount}</div>
          </div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-icon">
            <Crown size={18} />
          </div>
          <div className="pf-stat-meta">
            <div className="pf-stat-label">Plan tienda</div>
            <div className="pf-stat-value">{storeActive ? "Activo" : "Free"}</div>
          </div>
        </div>
      </div>

      <div className="pf-actions">
        <button className="pf-action" type="button" onClick={() => navigate("/store")}>
          <StoreIcon size={18} />
          Mi tienda
        </button>
        <button className="pf-action" type="button" onClick={openProfileEdit}>
          <Brush size={18} />
          Editar perfil
        </button>
        <button className="pf-action" type="button" onClick={onRegisterPasskey}>
          <Fingerprint size={18} />
          Activar huella
        </button>
        <button className="pf-action danger" type="button" onClick={onLogout}>
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>

      {passkeyMessage ? <div className="pf-note">{passkeyMessage}</div> : null}

      <div className="pf-section">
        <div className="pf-section-head">
          <div>
            <div className="pf-section-title">Mis productos</div>
            <div className="pf-section-sub">
              {storeActive ? "Tienda activa: puedes publicar sin límite." : `Límite Free: ${freeLimit}. Te quedan ${remaining}.`}
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="pf-empty">Aún no tienes productos publicados.</div>
        ) : (
          <div className="pf-products">
            {list.map((p) => {
              const normalized = normalizeCategory(p.category, p.subcategory);
              const catLabel = normalized.subcategory ? `${normalized.category} > ${normalized.subcategory}` : normalized.category;
              const img = resolveImageSrc(p.imageUrls?.[0] || p.imageUrl);
              return (
                <div key={p.id} className="pf-product">
                  <div className="pf-product-media" style={{ backgroundImage: `url(${img})` }} />
                  <div className="pf-product-main">
                    <div className="pf-product-top">
                      <div className="pf-product-title">{p.title}</div>
                      <div className="pf-product-price">{priceLabel(p.price)}</div>
                    </div>
                    <div className="pf-product-tags">
                      <span className="pf-tag">{catLabel}</span>
                      <span className="pf-tag muted">{p.condition || "Como nuevo"}</span>
                    </div>
                    <div className="pf-product-actions">
                      <button className="pf-mini" type="button" disabled={busyId === p.id} onClick={() => openEdit(p)}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button className="pf-mini danger" type="button" disabled={busyId === p.id} onClick={() => removeOne(p.id)}>
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>

                    {editingId === p.id ? (
                      <div className="pf-editor">
                        <div className="pf-grid2">
                          <div className="pf-field">
                            <div className="pf-label">Título</div>
                            <input className="pf-input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                          </div>
                          <div className="pf-field">
                            <div className="pf-label">Precio (€)</div>
                            <input className="pf-input" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} inputMode="decimal" />
                          </div>
                        </div>

                        <div className="pf-grid2">
                          <div className="pf-field">
                            <div className="pf-label">Stock</div>
                            <input className="pf-input" value={draft.stock} onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))} inputMode="numeric" />
                          </div>
                          <div className="pf-field">
                            <div className="pf-label">SKU</div>
                            <input className="pf-input" value={draft.sku} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} />
                          </div>
                        </div>

                        <div className="pf-grid2">
                          <div className="pf-field">
                            <div className="pf-label">Categoría</div>
                            <select
                              className="pf-input"
                              value={draft.category}
                              onChange={(e) => {
                                const next = e.target.value;
                                setDraft((d) => ({ ...d, category: next || "Otros", subcategory: "" }));
                              }}
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <select className="pf-input" value={draft.subcategory} onChange={(e) => setDraft((d) => ({ ...d, subcategory: e.target.value }))}>
                              <option value="">Sin subcategoría</option>
                              {(subcategoryMap[draft.category] || []).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="pf-field">
                            <div className="pf-label">Condición</div>
                            <input className="pf-input" value={draft.condition} onChange={(e) => setDraft((d) => ({ ...d, condition: e.target.value }))} />
                          </div>
                        </div>

                        <div className="pf-grid2">
                          <div className="pf-field">
                            <div className="pf-label">Ubicación</div>
                            <input className="pf-input" value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} />
                          </div>
                          <div className="pf-field">
                            <div className="pf-label">URL imagen</div>
                            <input className="pf-input" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
                          </div>
                        </div>

                        <div className="pf-field">
                          <div className="pf-label">Descripción</div>
                          <textarea className="pf-textarea" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
                        </div>

                        <div className="pf-editor-actions">
                          <button className="pf-mini primary" type="button" disabled={busyId === p.id} onClick={saveEdit}>
                            <Save size={16} /> Guardar
                          </button>
                          <button className="pf-mini" type="button" disabled={busyId === p.id} onClick={closeEdit}>
                            <X size={16} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editProfileOpen ? (
        <div className="pf-modal" role="dialog" aria-modal="true">
          <button className="pf-modal-backdrop" type="button" onClick={() => setEditProfileOpen(false)} aria-label="Cerrar" />
          <div className="pf-modal-sheet">
            <div className="pf-modal-head">
              <div className="pf-modal-title">Personalizar perfil</div>
              <button className="pf-modal-close" type="button" onClick={() => setEditProfileOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="pf-modal-body">
              <div className="pf-field">
                <div className="pf-label">Nombre</div>
                <input className="pf-input" value={profileDraft.name} onChange={(e) => setProfileDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>

              <div className="pf-field">
                <div className="pf-label">Color principal</div>
                <div className="pf-color-row">
                  <input type="color" value={profileDraft.themeColor || "#2563eb"} onChange={(e) => setProfileDraft((d) => ({ ...d, themeColor: e.target.value }))} />
                  <input className="pf-input" value={profileDraft.themeColor || ""} onChange={(e) => setProfileDraft((d) => ({ ...d, themeColor: e.target.value }))} placeholder="#2563eb" />
                </div>
              </div>

              <div className="pf-field">
                <div className="pf-label">Avatar</div>
                <div className="pf-media-row">
                  <div className="pf-media-preview" style={profileDraft.avatarUrl ? { backgroundImage: `url(${profileDraft.avatarUrl})` } : {}}>
                    {!profileDraft.avatarUrl ? <span>{initials}</span> : null}
                  </div>
                  <div className="pf-media-actions">
                    <button className="pf-mini" type="button" onClick={() => avatarInputRef.current?.click?.()}>
                      <Camera size={16} /> Subir
                    </button>
                    <button className="pf-mini" type="button" onClick={() => setProfileDraft((d) => ({ ...d, avatarUrl: "" }))}>
                      <X size={16} /> Quitar
                    </button>
                  </div>
                </div>
                <input className="pf-input" value={profileDraft.avatarUrl} onChange={(e) => setProfileDraft((d) => ({ ...d, avatarUrl: e.target.value }))} placeholder="URL del avatar (opcional)" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    setProfileBusy(true);
                    try {
                      const url = await uploadImageToCloudinary(f);
                      setProfileDraft((d) => ({ ...d, avatarUrl: url }));
                    } finally {
                      setProfileBusy(false);
                    }
                  }}
                />
              </div>

              <div className="pf-field">
                <div className="pf-label">Banner</div>
                <div className="pf-media-row">
                  <div className="pf-banner-preview" style={profileDraft.bannerUrl ? { backgroundImage: `url(${profileDraft.bannerUrl})` } : {}}>
                    {!profileDraft.bannerUrl ? <span>Banner</span> : null}
                  </div>
                  <div className="pf-media-actions">
                    <button className="pf-mini" type="button" onClick={() => bannerInputRef.current?.click?.()}>
                      <Camera size={16} /> Subir
                    </button>
                    <button className="pf-mini" type="button" onClick={() => setProfileDraft((d) => ({ ...d, bannerUrl: "" }))}>
                      <X size={16} /> Quitar
                    </button>
                  </div>
                </div>
                <input className="pf-input" value={profileDraft.bannerUrl} onChange={(e) => setProfileDraft((d) => ({ ...d, bannerUrl: e.target.value }))} placeholder="URL del banner (opcional)" />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    setProfileBusy(true);
                    try {
                      const url = await uploadImageToCloudinary(f);
                      setProfileDraft((d) => ({ ...d, bannerUrl: url }));
                    } finally {
                      setProfileBusy(false);
                    }
                  }}
                />
              </div>
            </div>

            <div className="pf-modal-footer">
              <button className="pf-save" type="button" disabled={profileBusy} onClick={saveProfile}>
                <Save size={18} /> Guardar cambios
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
