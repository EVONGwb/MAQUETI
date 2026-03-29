export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") return "http://localhost:3005";
  return "https://maqueti.onrender.com";
};

export const parseJsonResponse = async (res) => {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const bodyText = await res.text();
  const err = new Error(`Respuesta inesperada del servidor (HTTP ${res.status})`);
  err.nonJson = true;
  err.bodyText = bodyText;
  throw err;
};

export const resolveImageSrc = (imageUrl) => {
  const url =
    Array.isArray(imageUrl) ? (typeof imageUrl[0] === "string" ? imageUrl[0] : "") : typeof imageUrl === "string" ? imageUrl : "";
  if (!url) return "https://via.placeholder.com/600x400?text=MAQUETI";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getApiUrl()}${url}`;
};

export const fetchProducts = async () => {
  const res = await fetch(`${getApiUrl()}/api/products`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error cargando productos: ${res.status}`);
  return data;
};

export const fetchProductById = async (id) => {
  const res = await fetch(`${getApiUrl()}/api/products/${id}`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error cargando producto: ${res.status}`);
  return data;
};

const withAuthHeaders = (token, extra = {}) => {
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const fetchMyStore = async (token) => {
  const res = await fetch(`${getApiUrl()}/api/stores/me`, { headers: withAuthHeaders(token) });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    const err = new Error(data?.message || `Error cargando tienda: ${res.status}`);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
};

export const upsertMyStore = async (token, payload) => {
  const res = await fetch(`${getApiUrl()}/api/stores/me`, {
    method: "POST",
    headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload || {}),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    const err = new Error(data?.message || `Error guardando tienda: ${res.status}`);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
};

export const fetchPublicStore = async (slug) => {
  const res = await fetch(`${getApiUrl()}/api/stores/${encodeURIComponent(slug)}`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error cargando tienda: ${res.status}`);
  return data;
};

export const updateProduct = async (id, token, payload) => {
  const res = await fetch(`${getApiUrl()}/api/products/${id}`, {
    method: "PUT",
    headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload || {}),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error actualizando producto: ${res.status}`);
  return data;
};

export const deleteProduct = async (id, token) => {
  const res = await fetch(`${getApiUrl()}/api/products/${id}`, {
    method: "DELETE",
    headers: withAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error eliminando producto: ${res.status}`);
  return data;
};

export const createOrGetConversation = async (productId, token) => {
  const res = await fetch(`${getApiUrl()}/api/conversations`, {
    method: "POST",
    headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ productId }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error creando conversación: ${res.status}`);
  return data;
};

export const getUserConversations = async (token) => {
  const res = await fetch(`${getApiUrl()}/api/conversations`, { headers: withAuthHeaders(token) });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error cargando conversaciones: ${res.status}`);
  return data;
};

export const getConversationById = async (conversationId, token) => {
  const res = await fetch(`${getApiUrl()}/api/conversations/${conversationId}`, { headers: withAuthHeaders(token) });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error cargando conversación: ${res.status}`);
  return data;
};

export const getConversationMessages = async (conversationId, token) => {
  const res = await fetch(`${getApiUrl()}/api/conversations/${conversationId}/messages`, { headers: withAuthHeaders(token) });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error cargando mensajes: ${res.status}`);
  return data;
};

export const sendConversationMessage = async (conversationId, token, { text, images } = {}) => {
  const cleanText = text && String(text).trim() ? String(text) : "";
  const imgs = Array.isArray(images) ? images : [];

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const canUploadCloudinary = Boolean(cloudName && uploadPreset && typeof File !== "undefined");
  const hasFiles = canUploadCloudinary && imgs.some((x) => x instanceof File);

  if (hasFiles) {
    const uploadOne = async (file) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error?.message || "No se pudo subir la imagen");
      return j.secure_url;
    };

    const urls = await Promise.all(imgs.filter((x) => x instanceof File).slice(0, 5).map(uploadOne));
    const res = await fetch(`${getApiUrl()}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ text: cleanText, imageUrls: urls }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data?.message || `Error enviando mensaje: ${res.status}`);
    return data;
  }

  const formData = new FormData();
  if (cleanText) formData.append("text", cleanText);
  imgs.slice(0, 5).forEach((img) => formData.append("images", img));

  const res = await fetch(`${getApiUrl()}/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: withAuthHeaders(token),
    body: formData,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error enviando mensaje: ${res.status}`);
  return data;
};

export const markConversationAsRead = async (conversationId, token) => {
  const res = await fetch(`${getApiUrl()}/api/conversations/${conversationId}/read`, {
    method: "PATCH",
    headers: withAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.message || `Error marcando como leído: ${res.status}`);
  return data;
};
