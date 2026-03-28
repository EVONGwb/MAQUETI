const express = require("express"); 
const router = express.Router(); 
const authMiddleware = require("../middlewares/auth.middleware"); 
 
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
} = require("../../controllers/product.controller"); 
 
router.get("/products", authMiddleware.optionalAuthMiddleware, getProducts); 
router.get("/products/:id", authMiddleware.optionalAuthMiddleware, getProductById); 
router.post("/products", authMiddleware, createProduct); 
router.put("/products/:id", authMiddleware, updateProduct); 
router.delete("/products/:id", authMiddleware, deleteProduct); 
 
module.exports = router; 
