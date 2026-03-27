const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/maqueti";
    await mongoose.connect(uri);
    console.log("MongoDB conectado");
  } catch (error) {
    console.error("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
