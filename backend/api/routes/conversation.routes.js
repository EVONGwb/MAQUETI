const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("../middlewares/auth.middleware");
const {
  getConversations,
  createOrGetConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markAsRead
} = require("../../controllers/conversation.controller");

const uploadDir = path.join(__dirname, "../../..", "storage", "chat_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, webp)"));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.use(authMiddleware);

router.get("/", getConversations);
router.post("/", createOrGetConversation);
router.get("/:id", getConversationById);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", upload.array('images', 5), sendMessage);
router.patch("/:id/read", markAsRead);

module.exports = router;
