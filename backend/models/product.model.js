const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    userId: { type: Number, required: true, index: true },
    description: { type: String, default: null },
    condition: { type: String, default: "Como nuevo" },
    category: { type: String, default: "Otros" },
    subcategory: { type: String, default: null },
    location: { type: String, default: null },
    imageUrl: { type: String, default: null },
    stock: { type: Number, default: null },
    sku: { type: String, default: null },
    status: { type: String, default: "published", index: true },
    createdAt: { type: Number, required: true, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
