const db = require("../config/db"); 
 
const getProducts = (req, res) => { 
  const { userId } = req.query; 
 
  if (userId) { 
    return db.all( 
      "SELECT * FROM products WHERE userId = ?", 
      [userId], 
      (err, rows) => { 
        if (err) { 
          return res.status(500).json({ 
            message: "Error al obtener productos", 
          }); 
        } 
 
        res.json({ 
          total: rows.length, 
          products: rows, 
        }); 
      } 
    ); 
  } 
 
  db.all("SELECT * FROM products", [], (err, rows) => { 
    if (err) { 
      return res.status(500).json({ 
        message: "Error al obtener productos", 
      }); 
    } 
 
    res.json({ 
      total: rows.length, 
      products: rows, 
    }); 
  }); 
}; 
 
const getProductById = (req, res) => { 
  const { id } = req.params; 
 
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => { 
    if (err) { 
      return res.status(500).json({ 
        message: "Error al obtener producto", 
      }); 
    } 
 
    if (!row) { 
      return res.status(404).json({ 
        message: "Producto no encontrado", 
      }); 
    } 
 
    res.json({ 
      product: row, 
    }); 
  }); 
}; 
 
const createProduct = (req, res) => { 
  const { title, price } = req.body; 
  const userId = req.user?.id || req.body.userId; 
 
  if (!title || !price || !userId) { 
    return res.status(400).json({ 
      message: "Title, price y userId son obligatorios", 
    }); 
  } 
 
  const id = Date.now(); 
 
  db.run( 
    "INSERT INTO products (id, title, price, userId) VALUES (?, ?, ?, ?)", 
    [id, title, price, userId], 
    function (err) { 
      if (err) { 
        return res.status(500).json({ 
          message: "Error al crear producto", 
        }); 
      } 
 
      res.status(201).json({ 
        message: "Producto creado correctamente", 
        product: { 
          id, 
          title, 
          price, 
          userId, 
        }, 
      }); 
    } 
  ); 
}; 
 
const updateProduct = (req, res) => { 
  const { id } = req.params; 
  const { title, price } = req.body; 
 
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => { 
    if (err) { 
      return res.status(500).json({ 
        message: "Error al buscar producto", 
      }); 
    } 
 
    if (!row) { 
      return res.status(404).json({ 
        message: "Producto no encontrado", 
      }); 
    } 
 
    const updatedTitle = title !== undefined ? title : row.title; 
    const updatedPrice = price !== undefined ? price : row.price; 
 
    db.run( 
      "UPDATE products SET title = ?, price = ? WHERE id = ?", 
      [updatedTitle, updatedPrice, id], 
      function (err) { 
        if (err) { 
          return res.status(500).json({ 
            message: "Error al actualizar producto", 
          }); 
        } 
 
        res.json({ 
          message: "Producto actualizado correctamente", 
          product: { 
            id: Number(id), 
            title: updatedTitle, 
            price: updatedPrice, 
            userId: row.userId, 
          }, 
        }); 
      } 
    ); 
  }); 
}; 
 
const deleteProduct = (req, res) => { 
  const { id } = req.params; 
 
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => { 
    if (err) { 
      return res.status(500).json({ 
        message: "Error al buscar producto", 
      }); 
    } 
 
    if (!row) { 
      return res.status(404).json({ 
        message: "Producto no encontrado", 
      }); 
    } 
 
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) { 
      if (err) { 
        return res.status(500).json({ 
          message: "Error al eliminar producto", 
        }); 
      } 
 
      res.json({ 
        message: "Producto eliminado correctamente", 
        product: row, 
      }); 
    }); 
  }); 
}; 
 
module.exports = { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
}; 
