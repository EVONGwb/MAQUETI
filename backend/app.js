const express = require("express"); 

const app = express(); 

app.use(express.json()); 
app.use((req, res, next) => { 
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization"); 
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"); 
  if (req.method === "OPTIONS") { 
    return res.sendStatus(204); 
  } 
  next(); 
}); 

const testRoutes = require("./api/routes/test.routes"); 
const userRoutes = require("./api/routes/user.routes"); 
const productRoutes = require("./api/routes/product.routes"); 

app.use("/api", testRoutes); 
app.use("/api", userRoutes); 
app.use("/api", productRoutes); 

module.exports = app; 
