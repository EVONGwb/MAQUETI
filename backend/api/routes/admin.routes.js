const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const {
  updateUserStoreAccess,
  listAdminUsers,
  updateAdminUser,
  listAdminProducts,
  updateAdminProduct,
  deleteAdminProduct,
  listAdminStores,
  updateAdminStore,
  listAdminChats,
  getAdminChatMessages,
  updateAdminChat,
  getAdminSettings,
  patchAdminSettings,
  listAdminAds,
  createAdminAd,
  updateAdminAd,
  deleteAdminAd,
  listAdminAudit,
} = require("../../controllers/admin.controller");

router.patch("/admin/users/:id/store-access", authMiddleware, adminMiddleware, updateUserStoreAccess);
router.get("/admin/users", authMiddleware, adminMiddleware, listAdminUsers);
router.patch("/admin/users/:id", authMiddleware, adminMiddleware, updateAdminUser);

router.get("/admin/products", authMiddleware, adminMiddleware, listAdminProducts);
router.patch("/admin/products/:id", authMiddleware, adminMiddleware, updateAdminProduct);
router.delete("/admin/products/:id", authMiddleware, adminMiddleware, deleteAdminProduct);

router.get("/admin/stores", authMiddleware, adminMiddleware, listAdminStores);
router.patch("/admin/stores/:id", authMiddleware, adminMiddleware, updateAdminStore);

router.get("/admin/chats", authMiddleware, adminMiddleware, listAdminChats);
router.get("/admin/chats/:id/messages", authMiddleware, adminMiddleware, getAdminChatMessages);
router.patch("/admin/chats/:id", authMiddleware, adminMiddleware, updateAdminChat);

router.get("/admin/settings", authMiddleware, adminMiddleware, getAdminSettings);
router.patch("/admin/settings", authMiddleware, adminMiddleware, patchAdminSettings);

router.get("/admin/ads", authMiddleware, adminMiddleware, listAdminAds);
router.post("/admin/ads", authMiddleware, adminMiddleware, createAdminAd);
router.patch("/admin/ads/:id", authMiddleware, adminMiddleware, updateAdminAd);
router.delete("/admin/ads/:id", authMiddleware, adminMiddleware, deleteAdminAd);

router.get("/admin/audit", authMiddleware, adminMiddleware, listAdminAudit);

module.exports = router;
