const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user.model");

const SECRET = process.env.JWT_SECRET || "maqueti_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

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
    ).select({ id: 1, name: 1, email: 1 });

    if (!user) {
      return res.status(500).json({
        message: "Error al iniciar sesión",
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
      },
    });
  } catch (error) {
    return res.status(401).json({
      message: "Credenciales inválidas",
    });
  }
};

module.exports = {
  googleLogin,
};
