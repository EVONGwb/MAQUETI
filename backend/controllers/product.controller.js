const db = require("../config/db");

const dbAll = (sql, params) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

const dbGet = (sql, params) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });

const dbRun = (sql, params) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

const getProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ message: "Token requerido" });
    }

    if (userId && String(userId) !== String(requesterId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const rows = userId
      ? await dbAll("SELECT * FROM products WHERE userId = ? ORDER BY createdAt DESC", [userId])
      : await dbAll("SELECT * FROM products ORDER BY createdAt DESC", []);

    return res.json({ total: rows.length, products: rows });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener productos" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbGet("SELECT * FROM products WHERE id = ?", [id]);

    if (!row) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json({ product: row });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener producto" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, price, description, condition, category, location, imageUrl, stock, sku } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Token requerido" });
    }

    if (!title || !price) {
      return res.status(400).json({ message: "Title y price son obligatorios" });
    }

    const id = Date.now();
    const createdAt = Date.now();
    const safeStock = stock === undefined || stock === null || stock === "" ? null : Number(stock);

    await dbRun(
      "INSERT INTO products (id, title, price, userId, description, condition, category, location, imageUrl, stock, sku, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, price, userId, description || null, condition || "Como nuevo", category || "Otros", location || null, imageUrl || null, safeStock, sku || null, createdAt]
    );

    return res.status(201).json({
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
  } catch (error) {
    return res.status(500).json({ message: "Error al crear producto" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, description, condition, category, location, imageUrl, stock, sku } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const row = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
    if (!row) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (String(row.userId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado" });
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

    await dbRun(
      "UPDATE products SET title = ?, price = ?, description = ?, condition = ?, category = ?, location = ?, imageUrl = ?, stock = ?, sku = ? WHERE id = ?",
      [updatedTitle, updatedPrice, updatedDescription, updatedCondition, updatedCategory, updatedLocation, updatedImageUrl, updatedStock, updatedSku, id]
    );

    return res.json({
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
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar producto" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const row = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
    if (!row) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (String(row.userId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    await dbRun("DELETE FROM products WHERE id = ?", [id]);

    return res.json({ message: "Producto eliminado correctamente", product: row });
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar producto" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
