const express = require("express"); 
const router = express.Router(); 

const authMiddleware = require("../middlewares/auth.middleware");
 
const { 
  getUsers, 
  getMe,
  patchMe,
} = require("../../controllers/user.controller"); 
 
router.get("/users", getUsers); 
router.get("/users/me", authMiddleware, getMe);
router.patch("/users/me", authMiddleware, patchMe);
 
module.exports = router; 
