// models/Product.js
const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // New field for product category
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String }, // Optional: path to product image
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Cart Item Schema (stores user's cart)
const cartItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = { Product, CartItem };
