import React, { useEffect, useMemo, useState } from "react";
import { adminFetchChatMessages, adminFetchChats, adminUpdateChat } from "../../../services/api.js";

const fmtDate = (ms) => {
  const n = Number(ms);
  if (!Number.isFinite(n) || !n) return "—";
  return new Date(n).toLocaleString();
};

export default function ChatsModule({ token }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);

  const selected = useMemo(() => chats.find((c) => String(c.id) === String(selectedId)) || null, [chats, selectedId]);

  const load = async () => {
    if (!token) {
      setError("Token requerido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminFetchChats(token, { status: statusFilter || undefined });
      setChats(Array.isArray(data?.chats) ? data.chats : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar chats");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id) => {
    if (!token) return;
    setError("");
    try {
      const data = await adminFetchChatMessages(id, token);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar mensajes");
      setMessages([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
  }, [selectedId]);

  const setStatus = async (nextStatus) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await adminUpdateChat(selected.id, token, { status: nextStatus });
      const updated = res?.chat || null;
      if (updated) setChats((prev) => prev.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
    } catch (e) {
      setError(e?.message || "No se pudo actualizar chat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-split">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Chats</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 44, borderRadius: 12, padding: "0 12px" }}>
              <option value="">status: todos</option>
              <option value="open">open</option>
              <option value="archived">archived</option>
              <option value="closed">closed</option>
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
                <th>Producto</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((c) => (
                <tr key={c.id} className={String(selectedId) === String(c.id) ? "active" : ""} onClick={() => setSelectedId(c.id)}>
                  <td>{c.id}</td>
                  <td>{c.productId}</td>
                  <td>{c.buyerId}</td>
                  <td>{c.sellerId}</td>
                  <td>{c.status || "open"}</td>
                  <td>{fmtDate(c.lastMessageAt)}</td>
                </tr>
              ))}
              {!loading && chats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    No hay chats.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div className="admin-panel-title">Conversación</div>
          {selected ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="secondary-btn" type="button" disabled={saving} onClick={() => setStatus("open")}>
                Abrir
              </button>
              <button className="secondary-btn" type="button" disabled={saving} onClick={() => setStatus("archived")}>
                Archivar
              </button>
              <button className="logout-btn" type="button" disabled={saving} onClick={() => setStatus("closed")}>
                Cerrar
              </button>
            </div>
          ) : null}
        </div>

        {!selected ? (
          <div className="admin-muted">Selecciona un chat.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="admin-muted">{`Producto ${selected.productId} · Buyer ${selected.buyerId} · Seller ${selected.sellerId}`}</div>
            <button className="secondary-btn" type="button" onClick={() => loadMessages(selected.id)}>
              Recargar mensajes
            </button>
            <div style={{ display: "grid", gap: 8 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ borderRadius: 14, padding: 10, border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(15, 23, 42, 0.25)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "rgba(233, 238, 249, 0.75)" }}>
                    <span>{`Sender: ${m.senderId}`}</span>
                    <span>{fmtDate(m.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{m.text || ""}</div>
                  {Array.isArray(m.images) && m.images.length ? <div style={{ marginTop: 6, fontSize: 12, color: "rgba(233, 238, 249, 0.75)" }}>{`Imágenes: ${m.images.length}`}</div> : null}
                </div>
              ))}
              {messages.length === 0 ? <div className="admin-muted">Sin mensajes.</div> : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

