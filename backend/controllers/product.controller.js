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
  const { title, price, description, condition, category, location, imageUrl, stock, sku } = req.body; 
  const userId = req.user?.id || req.body.userId; 
 
  if (!title || !price || !userId) { 
    return res.status(400).json({ 
      message: "Title, price y userId son obligatorios", 
    }); 
  } 
 
  const id = Date.now(); 
 
  const createdAt = Date.now(); 
  const safeStock = stock === undefined || stock === null || stock === "" ? null : Number(stock); 
 
  db.run( 
    "INSERT INTO products (id, title, price, userId, description, condition, category, location, imageUrl, stock, sku, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
    [id, title, price, userId, description || null, condition || "Como nuevo", category || "Otros", location || null, imageUrl || null, safeStock, sku || null, createdAt], 
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
          description: description || null, 
          condition: condition || "Como nuevo", 
          category: category || "Otros", 
          location: location || null, 
          imageUrl: imageUrl || null, 
          stock: safeStock, 
          sku: sku || null, 
          createdAt, 
        }, 
      }); 
    } 
  ); 
}; 
 
const updateProduct = (req, res) => { 
  const { id } = req.params; 
  const { title, price, description, condition, category, location, imageUrl, stock, sku } = req.body; 
 
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
    const updatedDescription = description !== undefined ? description : row.description; 
    const updatedCondition = condition !== undefined ? condition : row.condition; 
    const updatedCategory = category !== undefined ? category : row.category; 
    const updatedLocation = location !== undefined ? location : row.location; 
    const updatedImageUrl = imageUrl !== undefined ? imageUrl : row.imageUrl; 
    const updatedStock = stock !== undefined ? (stock === null || stock === "" ? null : Number(stock)) : row.stock; 
    const updatedSku = sku !== undefined ? sku : row.sku; 
 
    db.run( 
      "UPDATE products SET title = ?, price = ?, description = ?, condition = ?, category = ?, location = ?, imageUrl = ?, stock = ?, sku = ? WHERE id = ?", 
      [updatedTitle, updatedPrice, updatedDescription, updatedCondition, updatedCategory, updatedLocation, updatedImageUrl, updatedStock, updatedSku, id], 
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
            description: updatedDescription, 
            condition: updatedCondition, 
            category: updatedCategory, 
            location: updatedLocation, 
            imageUrl: updatedImageUrl, 
            stock: updatedStock, 
            sku: updatedSku, 
            createdAt: row.createdAt, 
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
