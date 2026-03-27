const User = require("../models/user.model");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { id: 1, name: 1, email: 1, _id: 0 }).sort({ id: 1 }).lean();
    res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener usuarios",
    });
  }
};

module.exports = {
  getUsers,
};
