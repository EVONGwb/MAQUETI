const express = require("express"); 

const app = express(); 

app.use(express.json()); 

const testRoutes = require("./api/routes/test.routes"); 
const userRoutes = require("./api/routes/user.routes"); 
const productRoutes = require("./api/routes/product.routes"); 

app.use("/api", testRoutes); 
app.use("/api", userRoutes); 
app.use("/api", productRoutes); 

module.exports = app; 
