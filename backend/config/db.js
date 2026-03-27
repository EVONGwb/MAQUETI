const mongoose = require("mongoose");

const getMongoUri = () => {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (uri) return uri;
  if (process.env.NODE_ENV === "production") return "";
  return "mongodb://127.0.0.1:27017/maqueti";
};

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const uri = getMongoUri();
  if (!uri) {
    throw new Error("MONGODB_URI no configurado");
  }
  await mongoose.connect(uri);
  return mongoose.connection;
};

module.exports = { connectDb };
