const jwt = require("jsonwebtoken"); 

const SECRET = process.env.JWT_SECRET || "maqueti_secret"; 

const authMiddleware = (req, res, next) => { 
  const authHeader = req.headers.authorization; 

  if (!authHeader) { 
    return res.status(401).json({ 
      message: "Token requerido", 
    }); 
  } 

  const token = authHeader.split(" ")[1]; 

  try { 
    const decoded = jwt.verify(token, SECRET); 
    req.user = decoded; 
    next(); 
  } catch (error) { 
    return res.status(401).json({ 
      message: "Token inválido", 
    }); 
  } 
}; 

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido",
    });
  }
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
