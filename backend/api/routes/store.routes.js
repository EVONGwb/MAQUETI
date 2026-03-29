const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("../middlewares/auth.middleware");
const { requireStoreSubscription, getMyStore, upsertMyStore, getPublicStoreBySlug, uploadMyStoreAsset } = require("../../controllers/store.controller");

const uploadDir = path.join(__dirname, "../../..", "storage", "store_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) return cb(null, true);
  return cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, webp)"));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

router.get("/stores/me", authMiddleware, requireStoreSubscription, getMyStore);
router.put("/stores/me", authMiddleware, requireStoreSubscription, upsertMyStore);
router.post("/stores/me", authMiddleware, requireStoreSubscription, upsertMyStore);
router.post("/stores/me/upload", authMiddleware, requireStoreSubscription, upload.single("file"), uploadMyStoreAsset);
router.get("/stores/:slug", getPublicStoreBySlug);

module.exports = router;
