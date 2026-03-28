const express = require("express");
const router = express.Router();

const { googleLogin, passwordRegister, passwordLogin } = require("../../controllers/auth.controller");

router.post("/auth/google", googleLogin);
router.post("/auth/register", passwordRegister);
router.post("/auth/login", passwordLogin);

module.exports = router;
