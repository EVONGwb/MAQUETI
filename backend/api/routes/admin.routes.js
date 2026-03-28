const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const { updateUserStoreAccess } = require("../../controllers/admin.controller");

router.patch("/admin/users/:id/store-access", authMiddleware, adminMiddleware, updateUserStoreAccess);

module.exports = router;

