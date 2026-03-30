import React from "react";
import { useParams } from "react-router-dom";
import AdminShell from "./AdminShell.jsx";
import UsersModule from "./modules/UsersModule.jsx";
import ProductsModule from "./modules/ProductsModule.jsx";
import StoresModule from "./modules/StoresModule.jsx";
import ChatsModule from "./modules/ChatsModule.jsx";
import AdsModule from "./modules/AdsModule.jsx";
import PromotionsModule from "./modules/PromotionsModule.jsx";

const normalizeModule = (raw) => {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "users") return "users";
  if (v === "products") return "products";
  if (v === "stores") return "stores";
  if (v === "chats") return "chats";
  if (v === "ads") return "ads";
  if (v === "promotions") return "promotions";
  return "users";
};

export default function AdminManage({ token, user, onLogout }) {
  const params = useParams();
  const module = normalizeModule(params.module);

  const titleMap = {
    users: "Gestión: Usuarios",
    products: "Gestión: Productos",
    stores: "Gestión: Tiendas",
    chats: "Gestión: Chats",
    ads: "Gestión: Publicidad",
    promotions: "Gestión: Promociones",
  };

  return (
    <AdminShell active={module} user={user} onLogout={onLogout} title={titleMap[module]}>
      {module === "users" ? <UsersModule token={token} /> : null}
      {module === "products" ? <ProductsModule token={token} /> : null}
      {module === "stores" ? <StoresModule token={token} /> : null}
      {module === "chats" ? <ChatsModule token={token} /> : null}
      {module === "ads" ? <AdsModule token={token} /> : null}
      {module === "promotions" ? <PromotionsModule token={token} /> : null}
    </AdminShell>
  );
}
