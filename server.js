// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create the Express app
const app = express();
const http = require('http');
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io will be attached later after Message model is loaded

// Middleware
app.use(express.json()); // Allows us to get data in req.body

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define routes
// The authentication routes for signup and login
const authRoutes = require('./routes/api/auth');
app.use('/api', authRoutes);

// The vendor-specific and buyer-specific routes
const vendorRoutes = require('./routes/api/vendor');
const buyerRoutes = require('./routes/api/buyer');
app.use('/api/vendor', vendorRoutes);
app.use('/api/buyer', buyerRoutes);

// mount messages API
const messagesRoutes = require('./routes/api/messages');
app.use('/api/messages', messagesRoutes);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); // Serve uploaded files

// Define specific routes for the HTML files to handle friendly URLs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Buyer Pages
app.get('/buyer-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buyer-dashboard.html'));
});

app.get('/buyer/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product-listing.html'));
});

app.get('/buyer/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'my-cart.html'));
});

app.get('/buyer/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buyer-checkout.html'));
});

app.get('/buyer/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buyer-profile.html'));
});

app.get('/buyer/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buyer-history.html'));
});

app.get('/buyer/order-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buyer-order-details.html'));
});

app.get('/buyer/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buyer-chat.html'));
});

// Friendly shorthand route for chat root
app.get('/chat', (req, res) => {
    // Serve buyer chat by default. If you want role-aware routing, we can inspect a token and redirect accordingly.
    res.sendFile(path.join(__dirname, 'public', 'buyer-chat.html'));
});

// Vendor Pages
app.get('/vendor-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-dashboard.html'));
});

app.get('/vendor/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-products.html'));
});

app.get('/vendor/add-product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-add-product.html'));
});

app.get('/vendor/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-inventory.html'));
});

app.get('/vendor/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-orders.html'));
});

app.get('/vendor/order-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-order-details.html'));
});

app.get('/vendor/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-profile.html'));
});

app.get('/vendor/notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-notification.html'));
});

app.get('/vendor/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-chat.html'));
});


// Start the HTTP server (used by Socket.io)
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Setup Socket.io for realtime chat
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');

// Simple socket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user; // { id, role }
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(userId); // join a room named by userId for direct messaging

    socket.on('private_message', async (payload) => {
        // payload: { to, text }
        const from = userId;
        const to = payload.to;
        const text = payload.text;
        const conversationId = [from, to].sort().join('_');

        // save message
        const msg = new Message({ conversationId, from, to, text });
        await msg.save();

        // emit to recipient room and sender
        const messageData = { from, to, text, createdAt: msg.createdAt, _id: msg._id };
        io.to(to).emit('private_message', messageData);
        io.to(from).emit('private_message', messageData);
    });

    // Mark message as delivered when recipient receives it
    socket.on('delivered', (data) => {
        // data: { messageId, from, to }
        // Only notify sender if delivered to correct recipient
        if (data && data.messageId && data.from && data.to && String(userId) === String(data.to)) {
            io.to(data.from).emit('delivered', { messageId: data.messageId, to: data.to });
        }
    });

    socket.on('disconnect', () => {
        socket.leave(userId);
    });
});
