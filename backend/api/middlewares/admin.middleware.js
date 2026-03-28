const User = require("../../models/user.model");

module.exports = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Token requerido" });
    const user = await User.findOne({ id: Number(userId) }, { isAdmin: 1, _id: 0 }).lean();
    if (!user || !user.isAdmin) return res.status(403).json({ message: "Acceso admin requerido" });
    return next();
  } catch {
    return res.status(500).json({ message: "Error validando admin" });
  }
};

