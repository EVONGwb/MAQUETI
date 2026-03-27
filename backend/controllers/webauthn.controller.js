const jwt = require("jsonwebtoken");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const User = require("../models/user.model");
const Passkey = require("../models/passkey.model");

const SECRET = process.env.JWT_SECRET || "maqueti_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:5173";

const registrationChallenges = new Map();
let authenticationChallenge = null;

const getRpConfigFromRequest = (req) => {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      return { expectedOrigin: origin, rpID: url.hostname };
    } catch (error) {}
  }
  return { expectedOrigin: ORIGIN, rpID: RP_ID };
};

const toBase64url = (buffer) =>
  Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64url = (value) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Buffer.from(base64, "base64");
};

const getUserById = (id) => User.findOne({ id: Number(id) }, { id: 1, name: 1, email: 1, _id: 0 }).lean();

const getPasskeysByUserId = (userId) => Passkey.find({ userId: Number(userId) }, { _id: 0 }).lean();

const getPasskeyByCredentialId = (credentialId) =>
  Passkey.findOne({ credentialId: String(credentialId) }, { _id: 0 }).lean();

const upsertPasskey = async (passkey) => {
  await Passkey.updateOne(
    { credentialId: passkey.credentialId },
    {
      $set: {
        userId: Number(passkey.userId),
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports || null,
      },
    },
    { upsert: true }
  );
};

const registrationOptions = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const existingPasskeys = await getPasskeysByUserId(user.id);
    const { expectedOrigin, rpID } = getRpConfigFromRequest(req);

    const options = await generateRegistrationOptions({
      rpID,
      rpName: "MAQUETI",
      userID: new Uint8Array(Buffer.from(String(user.id))),
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

    registrationChallenges.set(String(user.id), { challenge: options.challenge, expectedOrigin, rpID });
    res.json(options);
  } catch (error) {
    console.error("Error en registrationOptions:", error);
    res.status(500).json({ message: "Error al iniciar huella" });
  }
};

const registrationVerify = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const stored = registrationChallenges.get(String(user.id));
    if (!stored || !stored.challenge) {
      return res.status(400).json({ message: "Challenge requerido" });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: stored.challenge,
      expectedOrigin: stored.expectedOrigin || ORIGIN,
      expectedRPID: stored.rpID || RP_ID,
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

const getAllPasskeys = () => Passkey.find({}, { _id: 0 }).lean();

const loginOptions = async (req, res) => {
  try {
    const { expectedOrigin, rpID } = getRpConfigFromRequest(req);
    const allPasskeys = await getAllPasskeys();

    const allowCredentials = allPasskeys.map((p) => {
      try {
        return {
          id: fromBase64url(p.credentialId),
          type: "public-key",
          transports: p.transports ? JSON.parse(p.transports) : undefined,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials,
      timeout: 120000,
    });

    authenticationChallenge = { challenge: options.challenge, expectedOrigin, rpID };
    res.json(options);
  } catch (error) {
    console.error("Error en loginOptions:", error);
    res.status(500).json({ message: "Error al iniciar sesión con huella" });
  }
};

const loginVerify = async (req, res) => {
  try {
    if (!authenticationChallenge || !authenticationChallenge.challenge) {
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
      expectedChallenge: authenticationChallenge.challenge,
      expectedOrigin: authenticationChallenge.expectedOrigin || ORIGIN,
      expectedRPID: authenticationChallenge.rpID || RP_ID,
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
