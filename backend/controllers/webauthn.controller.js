const db = require("../config/db");
const jwt = require("jsonwebtoken");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const SECRET = process.env.JWT_SECRET || "maqueti_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:5173";

const registrationChallenges = new Map();
let authenticationChallenge = null;

const toBase64url = (buffer) =>
  Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64url = (value) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Buffer.from(base64, "base64");
};

const getUserById = (id) =>
  new Promise((resolve, reject) => {
    db.get("SELECT id, name, email FROM users WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const getPasskeysByUserId = (userId) =>
  new Promise((resolve, reject) => {
    db.all("SELECT * FROM passkeys WHERE userId = ?", [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

const getPasskeyByCredentialId = (credentialId) =>
  new Promise((resolve, reject) => {
    db.get("SELECT * FROM passkeys WHERE credentialId = ?", [credentialId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const upsertPasskey = (passkey) =>
  new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO passkeys (credentialId, userId, publicKey, counter, transports) VALUES (?, ?, ?, ?, ?) ON CONFLICT(credentialId) DO UPDATE SET counter = excluded.counter, transports = excluded.transports",
      [passkey.credentialId, passkey.userId, passkey.publicKey, passkey.counter, passkey.transports],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });

const registrationOptions = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const existingPasskeys = await getPasskeysByUserId(user.id);

    const options = await generateRegistrationOptions({
      rpID: RP_ID,
      rpName: "MAQUETI",
      userID: String(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
      },
      excludeCredentials: existingPasskeys.map((p) => ({
        id: fromBase64url(p.credentialId),
        type: "public-key",
      })),
    });

    registrationChallenges.set(String(user.id), options.challenge);
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar huella" });
  }
};

const registrationVerify = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const expectedChallenge = registrationChallenges.get(String(user.id));
    if (!expectedChallenge) {
      return res.status(400).json({ message: "Challenge requerido" });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return res.status(401).json({ message: "Huella inválida" });
    }

    const { credentialID, credentialPublicKey, counter } = registrationInfo;
    const credentialId = toBase64url(credentialID);
    const publicKey = toBase64url(credentialPublicKey);
    const transports = Array.isArray(req.body?.response?.transports) ? JSON.stringify(req.body.response.transports) : null;

    await upsertPasskey({
      credentialId,
      userId: user.id,
      publicKey,
      counter,
      transports,
    });

    registrationChallenges.delete(String(user.id));

    res.json({ message: "Huella registrada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar huella" });
  }
};

const loginOptions = async (req, res) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
    });

    authenticationChallenge = options.challenge;
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión con huella" });
  }
};

const loginVerify = async (req, res) => {
  try {
    if (!authenticationChallenge) {
      return res.status(400).json({ message: "Challenge requerido" });
    }

    const credentialId = req.body?.id;
    if (!credentialId) {
      return res.status(400).json({ message: "Credencial requerida" });
    }

    const passkey = await getPasskeyByCredentialId(credentialId);
    if (!passkey) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: authenticationChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: fromBase64url(passkey.credentialId),
        credentialPublicKey: fromBase64url(passkey.publicKey),
        counter: passkey.counter,
      },
    });

    const { verified, authenticationInfo } = verification;
    if (!verified || !authenticationInfo) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    await upsertPasskey({
      credentialId: passkey.credentialId,
      userId: passkey.userId,
      publicKey: passkey.publicKey,
      counter: authenticationInfo.newCounter,
      transports: passkey.transports,
    });

    authenticationChallenge = null;

    const user = await getUserById(passkey.userId);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({
      message: "Login correcto",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión con huella" });
  }
};

module.exports = {
  registrationOptions,
  registrationVerify,
  loginOptions,
  loginVerify,
};
