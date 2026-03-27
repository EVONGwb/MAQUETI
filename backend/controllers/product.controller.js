const Product = require("../models/product.model");

const generateNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const getProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    const requesterId = req.user?.id;

    if (userId) {
      if (!requesterId) {
        return res.status(401).json({ message: "Token requerido" });
      }
      if (String(userId) !== String(requesterId)) {
        return res.status(403).json({ message: "No autorizado" });
      }
    }

    const query = userId ? { userId: Number(userId) } : {};
    const products = await Product.find(query, { _id: 0 }).sort({ createdAt: -1 }).lean();
    return res.json({ total: products.length, products });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener productos" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ id: Number(id) }, { _id: 0 }).lean();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json({ product });
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

    const id = generateNumericId();
    const createdAt = Date.now();
    const safeStock = stock === undefined || stock === null || stock === "" ? null : Number(stock);
    const finalImageUrl = imageUrl || "https://res.cloudinary.com/demo/image/upload/v1615545305/docs/shoes.jpg";
    await Product.create({
      id,
      title,
      price: Number(price),
      userId: Number(userId),
      description: description || null,
      condition: condition || "Como nuevo",
      category: category || "Otros",
      location: location || null,
      imageUrl: finalImageUrl,
      stock: safeStock,
      sku: sku || null,
      createdAt,
    });

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
        imageUrl: finalImageUrl,
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

    const row = await Product.findOne({ id: Number(id) }, { _id: 0 }).lean();
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

    await Product.updateOne(
      { id: Number(id) },
      {
        $set: {
          title: updatedTitle,
          price: updatedPrice,
          description: updatedDescription,
          condition: updatedCondition,
          category: updatedCategory,
          location: updatedLocation,
          imageUrl: updatedImageUrl,
          stock: updatedStock,
          sku: updatedSku,
        },
      }
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

    const row = await Product.findOne({ id: Number(id) }, { _id: 0 }).lean();
    if (!row) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (String(row.userId) !== String(userId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    await Product.deleteOne({ id: Number(id) });

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
