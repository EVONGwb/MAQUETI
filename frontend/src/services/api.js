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
