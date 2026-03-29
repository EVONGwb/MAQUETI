const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user.model");

const SECRET = process.env.JWT_SECRET || "maqueti_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const passwordRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const rawPassword = String(password || "");

    if (!cleanEmail || !rawPassword || !cleanName) return res.status(400).json({ message: "Nombre, email y contraseña son requeridos" });
    if (rawPassword.length < 6) return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });

    const existing = await User.findOne({ email: cleanEmail }).select({ id: 1, email: 1, googleSub: 1 });
    if (existing) return res.status(409).json({ message: "Este email ya está registrado" });

    const hashed = await bcrypt.hash(rawPassword, 10);
    const created = await User.create({
      id: generateNumericId(),
      name: cleanName,
      email: cleanEmail,
      password: hashed,
      googleSub: null,
    });

    const token = jwt.sign({ id: created.id, email: created.email }, SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({
      message: "Registro correcto",
      token,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        isAdmin: Boolean(created.isAdmin),
        status: created.status || "active",
        storeSubscriptionStatus: created.storeSubscriptionStatus || "none",
        storePlan: created.storePlan || null,
        storeSubscriptionEndsAt: created.storeSubscriptionEndsAt || null,
        storePaymentsUnlocked: Boolean(created.storePaymentsUnlocked),
        avatarUrl: created.avatarUrl || null,
        bannerUrl: created.bannerUrl || null,
        themeColor: created.themeColor || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al registrar" });
  }
};

const passwordLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");
    if (!cleanEmail || !rawPassword) return res.status(400).json({ message: "Email y contraseña son requeridos" });

    const user = await User.findOne({ email: cleanEmail }).select({
      id: 1,
      name: 1,
      email: 1,
      password: 1,
      googleSub: 1,
      isAdmin: 1,
      status: 1,
      storeSubscriptionStatus: 1,
      storePlan: 1,
      storeSubscriptionEndsAt: 1,
      storePaymentsUnlocked: 1,
    });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
    if (user.googleSub) return res.status(409).json({ message: "Este email usa Google. Entra con Google." });
    if (user.status && user.status !== "active") return res.status(403).json({ message: "Cuenta bloqueada" });

    const ok = await bcrypt.compare(rawPassword, user.password);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({
      message: "Login correcto",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: Boolean(user.isAdmin),
        status: user.status || "active",
        storeSubscriptionStatus: user.storeSubscriptionStatus || "none",
        storePlan: user.storePlan || null,
        storeSubscriptionEndsAt: user.storeSubscriptionEndsAt || null,
        storePaymentsUnlocked: Boolean(user.storePaymentsUnlocked),
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.bannerUrl || null,
        themeColor: user.themeColor || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      message: "Token de Google requerido",
    });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      message: "GOOGLE_CLIENT_ID no configurado",
    });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const id = Date.now();
    const name = payload.name || payload.email;
    const email = payload.email;
    const googleSub = payload.sub;
    const password = await bcrypt.hash(`${googleSub}:${SECRET}`, 10);
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: { name, googleSub, password },
        $setOnInsert: { id: generateNumericId() },
      },
      { new: true, upsert: true }
    ).select({ id: 1, name: 1, email: 1, isAdmin: 1, status: 1, storeSubscriptionStatus: 1, storePlan: 1, storeSubscriptionEndsAt: 1, storePaymentsUnlocked: 1, avatarUrl: 1, bannerUrl: 1, themeColor: 1 });

    if (!user) {
      return res.status(500).json({
        message: "Error al iniciar sesión",
      });
    }
    if (user.status && user.status !== "active") {
      return res.status(403).json({
        message: "Cuenta bloqueada",
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      message: "Login correcto",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: Boolean(user.isAdmin),
        status: user.status || "active",
        storeSubscriptionStatus: user.storeSubscriptionStatus || "none",
        storePlan: user.storePlan || null,
        storeSubscriptionEndsAt: user.storeSubscriptionEndsAt || null,
        storePaymentsUnlocked: Boolean(user.storePaymentsUnlocked),
        avatarUrl: user.avatarUrl || null,
        bannerUrl: user.bannerUrl || null,
        themeColor: user.themeColor || null,
      },
    });
  } catch (error) {
    return res.status(401).json({
      message: "Credenciales inválidas",
    });
  }
};

module.exports = {
  passwordRegister,
  passwordLogin,
  googleLogin,
};
