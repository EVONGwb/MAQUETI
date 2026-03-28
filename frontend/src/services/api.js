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
  if (!imageUrl || typeof imageUrl !== "string") return "https://via.placeholder.com/600x400?text=MAQUETI";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `${getApiUrl()}${imageUrl}`;
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
  const formData = new FormData();
  if (text && String(text).trim()) formData.append("text", String(text));
  if (Array.isArray(images)) images.forEach((img) => formData.append("images", img));

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
