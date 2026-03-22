const db = require("../config/db"); 
const bcrypt = require("bcrypt"); 
 
const jwt = require("jsonwebtoken"); 
const SECRET = process.env.JWT_SECRET || "maqueti_secret"; 
 
const getUsers = (req, res) => { 
  db.all("SELECT id, name, email FROM users", [], (err, rows) => { 
    if (err) { 
      return res.status(500).json({ 
        message: "Error al obtener usuarios", 
      }); 
    } 
 
    res.json({ 
      total: rows.length, 
      users: rows, 
    }); 
  }); 
}; 
 
const createUser = async (req, res) => { 
  const { name, email, password } = req.body; 
 
  if (!name || !email || !password) { 
    return res.status(400).json({ 
      message: "Nombre, email y password son obligatorios", 
    }); 
  } 
 
  const hashedPassword = await bcrypt.hash(password, 10); 
 
  const id = Date.now(); 
 
  db.run( 
    "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)", 
    [id, name, email, hashedPassword], 
    function (err) { 
      if (err) { 
        return res.status(500).json({ 
          message: "Error al crear usuario", 
        }); 
      } 
 
      res.status(201).json({ 
        message: "Usuario registrado correctamente", 
        user: { 
          id, 
          name, 
          email, 
        }, 
      }); 
    } 
  ); 
}; 
 
const loginUser = async (req, res) => { 
  const { email, password } = req.body; 
 
  if (!email || !password) { 
    return res.status(400).json({ 
      message: "Email y password son obligatorios", 
    }); 
  } 
 
  db.get( 
    "SELECT * FROM users WHERE email = ?", 
    [email], 
    async (err, user) => { 
      if (err) { 
        return res.status(500).json({ 
          message: "Error al iniciar sesión", 
        }); 
      } 
 
      if (!user) { 
        return res.status(401).json({ 
          message: "Credenciales inválidas", 
        }); 
      } 
 
      const validPassword = await bcrypt.compare(password, user.password); 
 
      if (!validPassword) { 
        return res.status(401).json({ 
          message: "Credenciales inválidas", 
        }); 
      } 
 
       const token = jwt.sign( 
         { id: user.id, email: user.email }, 
         SECRET, 
         { expiresIn: "1h" } 
       ); 
 
      res.json({ 
        message: "Login correcto", 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
        }, 
      }); 
    } 
  ); 
}; 
 
module.exports = { 
  getUsers, 
  createUser, 
  loginUser, 
}; 
