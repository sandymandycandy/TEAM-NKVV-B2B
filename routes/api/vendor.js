// routes/api/vendor.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Product } = require('../../models/Product');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Notification = require('../../models/Notification');
const multer = require('multer');
const path = require('path');
const cron = require('node-cron');

// Setup storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        if (req.user.role !== 'vendor') {
            return res.status(403).json({ msg: 'Access denied: not a vendor' });
        }
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Function to check for low stock and create notifications
const checkLowStock = async () => {
    try {
        const lowStockThreshold = 5;
        const lowStockProducts = await Product.find({ stock: { $lt: lowStockThreshold } });

        for (const product of lowStockProducts) {
            const existingNotification = await Notification.findOne({
                userId: product.vendorId,
                type: 'low_stock',
                'relatedEntity.id': product._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    userId: product.vendorId,
                    type: 'low_stock',
                    message: `Product "${product.name}" is low on stock (${product.stock} units).`,
                    relatedEntity: {
                        id: product._id,
                        type: 'Product'
                    }
                });
                await newNotification.save();
                console.log(`Low stock notification created for product: ${product.name}`);
            }
        }
    } catch (error) {
        console.error('Error checking for low stock:', error);
    }
};

// Schedule the low stock check to run every hour
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled low stock check...');
    checkLowStock();
});

// --- Product Management Routes ---
router.post('/products', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, price, unit, stock } = req.body;
        const imageUrl = req.file ? '/uploads/' + req.file.filename : null;

        const newProduct = new Product({
            name,
            description,
            category,
            price,
            unit,
            stock,
            vendorId: req.user.id,
            image: imageUrl
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: 'Product added successfully!', data: newProduct });
    } catch (err) {
        console.error('Error adding product:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/products', auth, async (req, res) => {
    try {
        const products = await Product.find({ vendorId: req.user.id });
        res.json({ success: true, data: products });
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/products/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, vendorId: req.user.id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
        }
        res.json({ success: true, data: product });
    } catch (err) {
        console.error('Error fetching product for edit:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/products/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, price, unit, stock } = req.body;
        const imageUrl = req.file ? '/uploads/' + req.file.filename : null;

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.user.id },
            { name, description, category, price, unit, stock, ...(imageUrl && { image: imageUrl }) },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
        }
        res.json({ success: true, message: 'Product updated successfully!', data: updatedProduct });
    } catch (err) {
        console.error('Error updating product:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.delete('/products/:id', auth, async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
        }
        res.json({ success: true, message: 'Product deleted successfully!' });
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Inventory Routes ---
router.get('/inventory', auth, async (req, res) => {
    try {
        const products = await Product.find({ vendorId: req.user.id });
        const inventoryData = products.map(p => ({
            _id: p._id,
            name: p.name,
            category: p.category,
            price: p.price,
            unit: p.unit,
            stock: p.stock,
            expiryDate: p.expiryDate ? p.expiryDate.toISOString().split('T')[0] : 'N/A'
        }));
        res.json({ success: true, data: inventoryData });
    } catch (err) {
        console.error('Error fetching inventory:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// --- Orders Routes ---
router.get('/orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ vendorId: req.user.id })
            // THIS IS THE CORRECTED LINE
            .populate('buyerId', 'name email')
            .populate({
                path: 'products.productId',
                model: 'Product',
                select: 'name price unit'
            });

        res.json({ success: true, orders: orders });
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/vendor/orders/:id/delivered
// @desc    Mark an order as delivered
// @access  Private (Vendor only)
router.put('/orders/:id/delivered', auth, async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.user.id },
            { status: 'Delivered' },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
        }
        res.json({ success: true, message: `Order #${order.orderIdDisplay} marked as delivered.` });
    } catch (err) {
        console.error('Error marking order as delivered:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// @route   PUT /api/vendor/orders/:id/cancelled
// @desc    Mark an order as cancelled
// @access  Private (Vendor only)
router.put('/orders/:id/cancelled', auth, async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.user.id },
            { status: 'Cancelled' },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
        }
        res.json({ success: true, message: `Order #${order.orderIdDisplay} marked as cancelled.` });
    } catch (err) {
        console.error('Error marking order as cancelled:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// --- Notifications Routes ---
router.get('/notifications', auth, async (req, res) => {
    try {
        // Handle a request to get just the unread count
        if (req.query.count) {
            const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
            return res.json({ success: true, count });
        }

        const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });

        const enhancedNotifications = await Promise.all(notifications.map(async (n) => {
            if (n.type === 'new_order' && n.relatedEntity && n.relatedEntity.id) {
                const order = await Order.findById(n.relatedEntity.id).populate('buyerId', 'name email phone address profileImage');
                if (order) {
                    return {
                        _id: n._id,
                        type: n.type,
                        message: n.message,
                        isRead: n.isRead,
                        time: n.createdAt,
                        orderId: order.orderIdDisplay,
                        buyerName: order.buyerId?.name,
                        buyerEmail: order.buyerId?.email,
                        buyerPhone: order.buyerId?.phone,
                        buyerAddress: order.buyerId?.address,
                        image: order.buyerId?.profileImage || 'https://randomuser.me/api/portraits/men/45.jpg',
                    };
                }
            } else if (n.type === 'low_stock' && n.relatedEntity && n.relatedEntity.id) {
                const product = await Product.findById(n.relatedEntity.id);
                return {
                    _id: n._id,
                    type: n.type,
                    message: n.message,
                    isRead: n.isRead,
                    time: n.createdAt,
                    productName: product?.name,
                };
            }
            return {
                _id: n._id,
                type: n.type,
                message: n.message,
                isRead: n.isRead,
                time: n.createdAt
            };
        }));
        res.json({ success: true, data: enhancedNotifications });
    } catch (err) {
        console.error('Error fetching notifications:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// --- Profile Routes ---
router.get('/profile', auth, async (req, res) => {
    try {
        const userProfile = await User.findById(req.user.id).select('-password');
        if (!userProfile) {
            return res.status(404).json({ success: false, message: 'Vendor profile not found' });
        }
        res.json({ success: true, data: userProfile });
    } catch (err) {
        console.error('Error fetching vendor profile:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/profile', auth, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'fssai', maxCount: 1 },
    { name: 'license', maxCount: 1 }
]), async (req, res) => {
    try {
        const { fullName, phone, dob, address, pan, gst, aadhar } = req.body;

        const updateFields = { fullName, phone, dob, address, pan, gst, aadhar };

        if (req.files) {
            if (req.files['profileImage']) {
                updateFields.profileImage = '/uploads/' + req.files['profileImage'][0].filename;
            }
            if (req.files['fssai']) {
                updateFields.fssaiCertificate = '/uploads/' + req.files['fssai'][0].filename;
            }
            if (req.files['license']) {
                updateFields.tradeLicense = '/uploads/' + req.files['license'][0].filename;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Vendor profile not found' });
        }
        res.json({ success: true, message: 'Profile updated successfully!', data: updatedUser });
    } catch (err) {
        console.error('Error updating vendor profile:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// @route   GET /api/vendor/dashboard-data
// @desc    Get dashboard data for the authenticated vendor
// @access  Private (Vendor only)
router.get('/dashboard-data', auth, async (req, res) => {
    try {
        const vendorId = req.user.id;

        // Fetch real data from the database

        const totalSales = await Order.aggregate([
            { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), status: 'Delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const pendingOrdersCount = await Order.countDocuments({ vendorId, status: 'Pending' });

        const topSellingItems = await Order.aggregate([
            { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalSales: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 3 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            {
                $project: {
                    _id: 0,
                    name: '$productInfo.name',
                    sales: '$totalSales'
                }
            }
        ]);

        const lowStockProducts = await Product.find({ vendorId, stock: { $lt: 5 } }).limit(2);

        // Fetch recent orders by status
        const recentDelivered = await Order.find({ vendorId, status: 'Delivered' }).sort({ orderDate: -1 }).limit(3).populate('buyerId', 'name');
        const recentPending = await Order.find({ vendorId, status: 'Pending' }).sort({ orderDate: -1 }).limit(3).populate('buyerId', 'name');
        const recentCancelled = await Order.find({ vendorId, status: 'Cancelled' }).sort({ orderDate: -1 }).limit(3).populate('buyerId', 'name');

        const notificationCount = await Notification.countDocuments({ userId: vendorId, isRead: false });

        const dashboardData = {
            totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
            pendingOrders: pendingOrdersCount,
            topSellingItems: topSellingItems,
            lowStockAlerts: lowStockProducts.map(p => ({
                _id: p._id,
                name: p.name,
                stock: p.stock
            })),
            recentOrders: {
                delivered: recentDelivered,
                pending: recentPending,
                cancelled: recentCancelled
            },
            notifications: notificationCount
        };

        res.json({ success: true, data: dashboardData });
    } catch (err) {
        console.error('Error fetching dashboard data:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// @route   GET /api/vendor/orders/:id
// @desc    Get single order details
// @access  Private (Vendor only)
router.get('/orders/:id', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        let order;

        if (mongoose.isValidObjectId(orderId)) {
            order = await Order.findOne({
                $or: [{ _id: orderId }, { orderIdDisplay: orderId }],
                vendorId: req.user.id
            })
                .populate('buyerId', 'name email phone address profileImage')
                .populate('products.productId', 'name price image unit');
        } else {
            order = await Order.findOne({
                orderIdDisplay: orderId,
                vendorId: req.user.id
            })
                .populate('buyerId', 'name email phone address profileImage')
                .populate('products.productId', 'name price image unit');
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (err) {
        console.error('Error fetching order details:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
