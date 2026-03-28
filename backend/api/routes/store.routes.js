const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { requireStoreSubscription, getMyStore, upsertMyStore, getPublicStoreBySlug } = require("../../controllers/store.controller");

router.get("/stores/me", authMiddleware, getMyStore);
router.put("/stores/me", authMiddleware, requireStoreSubscription, upsertMyStore);
router.post("/stores/me", authMiddleware, requireStoreSubscription, upsertMyStore);
router.get("/stores/:slug", getPublicStoreBySlug);

module.exports = router;

