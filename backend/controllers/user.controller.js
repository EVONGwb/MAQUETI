const db = require("../config/db"); 
 
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
 
module.exports = { 
  getUsers, 
}; 
