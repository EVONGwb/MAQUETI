const express = require("express");
const cors = require("cors");
const path = require("path");
const { createCorsOptions } = require("./config/cors");

const app = express();

app.use(cors(createCorsOptions()));
app.use(express.json()); 

app.use("/uploads/chat", express.static(path.join(__dirname, "../storage/chat_uploads")));
app.use("/uploads/store", express.static(path.join(__dirname, "../storage/store_uploads")));

const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const webauthnRoutes = require("./routes/webauthnRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const conversationRoutes = require("./routes/chatRoutes");
const storeRoutes = require("./routes/storeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const promotionRoutes = require("./routes/promotionRoutes");

app.use("/api", testRoutes); 
app.use("/api", authRoutes); 
app.use("/api", webauthnRoutes); 
app.use("/api", userRoutes); 
app.use("/api", productRoutes); 
app.use("/api", storeRoutes);
app.use("/api", adminRoutes);
app.use("/api", promotionRoutes);
app.use("/api/conversations", conversationRoutes);

const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));
app.get(/^\/(?!api|uploads).*/, (req, res) => {
  return res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) return res.status(404).send("Frontend no construido");
    return undefined;
  });
});

module.exports = app;
