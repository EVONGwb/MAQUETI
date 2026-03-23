const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json()); 

const testRoutes = require("./api/routes/test.routes"); 
const authRoutes = require("./api/routes/auth.routes"); 
const webauthnRoutes = require("./api/routes/webauthn.routes"); 
const userRoutes = require("./api/routes/user.routes"); 
const productRoutes = require("./api/routes/product.routes"); 

app.use("/api", testRoutes); 
app.use("/api", authRoutes); 
app.use("/api", webauthnRoutes); 
app.use("/api", userRoutes); 
app.use("/api", productRoutes); 

module.exports = app; 
