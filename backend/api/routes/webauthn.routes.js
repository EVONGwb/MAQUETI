const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

const {
  registrationOptions,
  registrationVerify,
  loginOptions,
  loginVerify,
} = require("../../controllers/webauthn.controller");

router.get("/auth/webauthn/register/options", authMiddleware, registrationOptions);
router.post("/auth/webauthn/register/verify", authMiddleware, registrationVerify);
router.get("/auth/webauthn/login/options", loginOptions);
router.post("/auth/webauthn/login/verify", loginVerify);

module.exports = router;
