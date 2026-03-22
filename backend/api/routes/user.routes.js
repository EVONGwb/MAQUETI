const express = require("express"); 
const router = express.Router(); 
 
const { 
  getUsers, 
  createUser, 
  loginUser, 
} = require("../../controllers/user.controller"); 
 
router.get("/users", getUsers); 
router.post("/users", createUser); 
router.post("/register", createUser); 
router.post("/login", loginUser); 
 
module.exports = router; 
