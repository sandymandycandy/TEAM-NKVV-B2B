// routes/api/buyer.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Product, CartItem } = require('../../models/Product');
const User = require('../../models/User'); // Corrected import
const Order = require('../../models/Order');
const Notification = require('../../models/Notification');

// Middleware to protect routes and check for buyer role
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        
        if (req.user.role !== 'buyer') {
            return res.status(403).json({ msg: 'Access denied: not a buyer' });
        }
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// --- Dashboard routes ---
router.get('/dashboard-data', auth, async (req, res) => {
    try {
        const buyerId = req.user.id;

        // Fetching real-time data from the database
        const successfulOrdersCount = await Order.countDocuments({ buyerId, status: 'Delivered' });
        const pendingOrdersCount = await Order.countDocuments({ buyerId, status: 'Pending' });
        const cancelledOrdersCount = await Order.countDocuments({ buyerId, status: 'Cancelled' });
        
        // Fetch recent orders
        const recentOrders = await Order.find({ buyerId }).sort({ orderDate: -1 }).limit(3);

        // Fetch frequently bought items
        const frequentlyBoughtItems = await Order.aggregate([
            { $match: { buyerId: new mongoose.Types.ObjectId(buyerId) } },
            { $unwind: '$products' },
            { $group: {
                _id: '$products.productId',
                count: { $sum: '$products.quantity' }
            }},
            { $sort: { count: -1 } },
            { $limit: 3 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            { $project: {
                _id: 0,
                name: '$productInfo.name',
                count: '$count'
            }}
        ]);

        const dashboardData = {
            successfulOrders: successfulOrdersCount,
            pendingOrders: pendingOrdersCount,
            cancelledOrders: cancelledOrdersCount,
            ongoingSales: [
                { title: 'Buy 1 Get 1 Free', vendor: 'Organic Vendors', description: 'On select organic vegetables. Valid till July 31st.' },
                { title: '20% Off', vendor: 'Nature Foods', description: 'On orders above ₹1000.' },
                { title: 'Free Delivery', vendor: 'All Vendors', description: 'For all orders placed this weekend.' },
            ],
            bestsellers: [
                { name: 'Paneer Puffs', sales: 120 },
                { name: 'Masala Dosa', sales: 98 },
                { name: 'Samosa', sales: 85 },
            ],
            frequentlyBought: frequentlyBoughtItems, // Use dynamic data
            recentOrders: {
                delivered: recentOrders.filter(o => o.status === 'Delivered').map(o => o.orderIdDisplay),
                pending: recentOrders.filter(o => o.status === 'Pending').map(o => o.orderIdDisplay),
                cancelled: recentOrders.filter(o => o.status === 'Cancelled').map(o => o.orderIdDisplay)
            }
        };
        
        res.json({ success: true, ...dashboardData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Product Listing Routes ---
router.get('/products', auth, async (req, res) => {
    try {
        const products = await Product.find({ stock: { $gt: 0 } });
        res.json({ success: true, data: products });
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Cart Routes ---
router.post('/cart', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        let cartItem = await CartItem.findOne({ userId, productId });

        if (cartItem) {
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            cartItem = new CartItem({ userId, productId, quantity });
            await cartItem.save();
        }

        res.json({ success: true, message: 'Product added to cart!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/cart', auth, async (req, res) => {
    try {
        const cartItems = await CartItem.find({ userId: req.user.id }).populate('productId');
        
        let total = 0;
        const cartWithSubtotal = cartItems.map(item => {
            const subtotal = item.quantity * item.productId.price;
            total += subtotal;
            return {
                _id: item._id,
                productId: item.productId,
                quantity: item.quantity,
                subtotal
            };
        });
        res.json({ success: true, data: cartWithSubtotal, total });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/cart/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const cartItem = await CartItem.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { quantity },
            { new: true, runValidators: true }
        );

        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found.' });
        }
        res.json({ success: true, message: 'Cart item updated successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.delete('/cart/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await CartItem.findOneAndDelete({ _id: id, userId: req.user.id });

        if (!deletedItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found.' });
        }
        res.json({ success: true, message: 'Item removed from cart.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Profile Routes ---
router.get('/profile', auth, async (req, res) => {
    try {
        const userProfile = await User.findById(req.user.id).select('-password');
        if (!userProfile) {
            return res.status(404).json({ success: false, message: 'Buyer profile not found' });
        }
        res.json({ success: true, data: userProfile });
    } catch (err) {
        console.error('Error fetching buyer profile:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { fullName, phone, dob, address, pan, gst, aadhar } = req.body;
        const updateFields = { fullName, phone, dob, address, pan, gst, aadhar };

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Buyer profile not found' });
        }
        res.json({ success: true, message: 'Profile updated successfully!', data: updatedUser });
    } catch (err) {
        console.error('Error updating buyer profile:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Order History Routes ---
router.get('/history', auth, async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user.id }).populate('vendorId', 'name');

        const orderHistory = orders.map(order => ({
            orderId: order.orderIdDisplay,
            date: new Date(order.orderDate).toLocaleDateString(),
            total: order.totalAmount,
            vendorName: order.vendorId.name,
            statusText: order.status,
            statusColor: order.status === 'Delivered' ? 'green' : order.status === 'Pending' ? 'yellow' : 'red'
        }));
        
        res.json({ success: true, data: orderHistory });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Order Placement Route ---
router.post('/orders', auth, async (req, res) => {
    try {
        const { deliveryAddress, paymentMethod } = req.body;
        const userId = req.user.id;

        const cartItems = await CartItem.find({ userId }).populate('productId');
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty.' });
        }
        
        const ordersByVendor = {};
        cartItems.forEach(item => {
            const vendorId = item.productId.vendorId.toString();
            if (!ordersByVendor[vendorId]) {
                ordersByVendor[vendorId] = {
                    products: [],
                    totalAmount: 0
                };
            }
            ordersByVendor[vendorId].products.push({
                productId: item.productId._id,
                quantity: item.quantity,
                priceAtOrder: item.productId.price
            });
            ordersByVendor[vendorId].totalAmount += item.quantity * item.productId.price;
        });

        const newOrders = [];
        for (const vendorId in ordersByVendor) {
            const vendorOrder = ordersByVendor[vendorId];
            const newOrder = new Order({
                buyerId: userId,
                vendorId: vendorId,
                products: vendorOrder.products,
                totalAmount: vendorOrder.totalAmount,
                deliveryAddress: deliveryAddress,
                paymentMethod: paymentMethod,
                orderIdDisplay: `ORD${Math.floor(10000 + Math.random() * 90000)}`,
                customerName: (await User.findById(userId))?.name
            });
            await newOrder.save();
            newOrders.push(newOrder);

            const vendorNotification = new Notification({
                userId: vendorId,
                type: 'new_order',
                message: `You have a new order (#${newOrder.orderIdDisplay}) from ${newOrder.customerName}.`,
                relatedEntity: {
                    id: newOrder._id,
                    type: 'Order'
                }
            });
            await vendorNotification.save();
        }

        await CartItem.deleteMany({ userId });

        res.json({ success: true, message: 'Order placed successfully!' });
    } catch (err) {
        console.error('Error placing order:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
