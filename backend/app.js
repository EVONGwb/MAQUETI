const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json()); 

app.use("/uploads/chat", express.static(path.join(__dirname, "../storage/chat_uploads")));

const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const webauthnRoutes = require("./routes/webauthnRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const conversationRoutes = require("./routes/chatRoutes");

app.use("/api", testRoutes); 
app.use("/api", authRoutes); 
app.use("/api", webauthnRoutes); 
app.use("/api", userRoutes); 
app.use("/api", productRoutes); 
app.use("/api/conversations", conversationRoutes);

module.exports = app;
