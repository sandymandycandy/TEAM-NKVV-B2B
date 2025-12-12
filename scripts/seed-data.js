// scripts/seed-data.js
// Comprehensive seed script for B2B Marketplace with realistic data

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const { Product, CartItem } = require('../models/Product');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Realistic Indian business data
const vendorsData = [
    {
        name: 'Sharma Traders',
        email: 'sharmatraders@gmail.com',
        password: 'Password123',
        role: 'vendor',
        fullName: 'Rajesh Kumar Sharma',
        phone: '+91 98765 43210',
        dob: new Date('1975-03-15'),
        address: '45, Gandhi Market, Chandni Chowk, Delhi - 110006',
        pan: 'ABCPS1234K',
        gst: '07ABCPS1234K1Z5',
        aadhar: '1234 5678 9012'
    },
    {
        name: 'Gujarat Spice Exports',
        email: 'gujaratspice@business.com',
        password: 'Password123',
        role: 'vendor',
        fullName: 'Mehul Patel',
        phone: '+91 94265 12345',
        dob: new Date('1980-08-22'),
        address: '123, GIDC Industrial Estate, Ahmedabad, Gujarat - 380015',
        pan: 'DEFPG5678L',
        gst: '24DEFPG5678L1Z3',
        aadhar: '9876 5432 1098'
    },
    {
        name: 'Mumbai Fresh Produce',
        email: 'mumbaifresh@vendor.in',
        password: 'Password123',
        role: 'vendor',
        fullName: 'Priya Deshmukh',
        phone: '+91 99201 45678',
        dob: new Date('1985-12-10'),
        address: '78, Crawford Market, Mumbai, Maharashtra - 400001',
        pan: 'GHIPQ9012M',
        gst: '27GHIPQ9012M1Z8',
        aadhar: '4567 8901 2345'
    },
    {
        name: 'South India Agro',
        email: 'southindiaagro@gmail.com',
        password: 'Password123',
        role: 'vendor',
        fullName: 'Venkatesh Rao',
        phone: '+91 98451 23456',
        dob: new Date('1978-06-05'),
        address: '234, KR Market, Bengaluru, Karnataka - 560002',
        pan: 'JKLRS3456N',
        gst: '29JKLRS3456N1Z6',
        aadhar: '7890 1234 5678'
    }
];

const buyersData = [
    {
        name: 'Metro Supermart',
        email: 'metrosupermart@gmail.com',
        password: 'Password123',
        role: 'buyer',
        fullName: 'Anil Kapoor',
        phone: '+91 98111 22333',
        dob: new Date('1982-04-18'),
        address: '56, MG Road, Gurugram, Haryana - 122001',
        pan: 'MNOTU7890P',
        gst: '06MNOTU7890P1Z2',
        aadhar: '3456 7890 1234'
    },
    {
        name: 'Royal Restaurant Chain',
        email: 'royal.restaurants@business.com',
        password: 'Password123',
        role: 'buyer',
        fullName: 'Sameer Khan',
        phone: '+91 98200 55666',
        dob: new Date('1979-11-25'),
        address: '89, Linking Road, Bandra, Mumbai - 400050',
        pan: 'PQRVW1234Q',
        gst: '27PQRVW1234Q1Z9',
        aadhar: '6789 0123 4567'
    },
    {
        name: 'Chennai Food Hub',
        email: 'chennaifoodhub@buyer.in',
        password: 'Password123',
        role: 'buyer',
        fullName: 'Lakshmi Narayanan',
        phone: '+91 98841 77888',
        dob: new Date('1988-07-30'),
        address: '167, Anna Salai, Chennai, Tamil Nadu - 600002',
        pan: 'STUXZ5678R',
        gst: '33STUXZ5678R1Z4',
        aadhar: '0123 4567 8901'
    },
    {
        name: 'Punjab Wholesale Mart',
        email: 'punjabwholesale@gmail.com',
        password: 'Password123',
        role: 'buyer',
        fullName: 'Harpreet Singh',
        phone: '+91 98145 99000',
        dob: new Date('1983-02-14'),
        address: '45, Hall Bazaar, Amritsar, Punjab - 143001',
        pan: 'YZABC9012S',
        gst: '03YZABC9012S1Z1',
        aadhar: '5678 9012 3456'
    },
    {
        name: 'Kolkata Grocers',
        email: 'kolkatagrocers@business.com',
        password: 'Password123',
        role: 'buyer',
        fullName: 'Subhash Banerjee',
        phone: '+91 98310 11222',
        dob: new Date('1976-09-08'),
        address: '23, New Market, Kolkata, West Bengal - 700087',
        pan: 'DEFGH3456T',
        gst: '19DEFGH3456T1Z7',
        aadhar: '2345 6789 0123'
    }
];

// Products by vendor (will be populated with vendorId after vendors are created)
const productsData = {
    'sharmatraders@gmail.com': [
        { name: 'Premium Basmati Rice', description: 'Aged long-grain basmati rice, perfect for biryani and pulao. Sourced from Punjab farms.', category: 'Grains & Rice', price: 145, unit: 'kg', stock: 5000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
        { name: 'Organic Wheat Flour (Atta)', description: 'Stone-ground whole wheat flour, 100% organic. Rich in fiber and nutrients.', category: 'Grains & Rice', price: 48, unit: 'kg', stock: 8000, image: 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=400&q=80' },
        { name: 'Toor Dal (Arhar)', description: 'Premium split pigeon peas, cleaned and polished. Essential for sambar and dal.', category: 'Pulses & Lentils', price: 135, unit: 'kg', stock: 3000, image: '/uploads/toor-dal-packet.png' },
        { name: 'Moong Dal Yellow', description: 'Split yellow moong beans, easy to cook and highly digestible.', category: 'Pulses & Lentils', price: 125, unit: 'kg', stock: 2500, image: '/uploads/moong-dal-yellow.png' },
        { name: 'Chana Dal', description: 'Split Bengal gram, perfect for sweets and savory dishes.', category: 'Pulses & Lentils', price: 95, unit: 'kg', stock: 4000, image: '/uploads/chana-dal.png' },
        { name: 'Sona Masoori Rice', description: 'Light-weight aromatic rice from Andhra Pradesh. Low glycemic index.', category: 'Grains & Rice', price: 68, unit: 'kg', stock: 6000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' }
    ],
    'gujaratspice@business.com': [
        { name: 'Kashmiri Red Chilli Powder', description: 'Vibrant red color with mild heat. Perfect for curries and tandoori dishes.', category: 'Spices', price: 320, unit: 'kg', stock: 1500, image: '/uploads/red-chilli.png' },
        { name: 'Turmeric Powder (Haldi)', description: 'Premium Sangli turmeric with high curcumin content. Lab tested for purity.', category: 'Spices', price: 185, unit: 'kg', stock: 2000, image: '/uploads/turmeric-powder.png' },
        { name: 'Cumin Seeds (Jeera)', description: 'Whole cumin seeds from Rajasthan. Strong aroma and flavor.', category: 'Spices', price: 280, unit: 'kg', stock: 1200, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
        { name: 'Coriander Powder (Dhaniya)', description: 'Freshly ground coriander seeds. Essential spice for Indian cooking.', category: 'Spices', price: 165, unit: 'kg', stock: 1800, image: 'https://images.unsplash.com/photo-1599909533621-9a594bf78459?auto=format&fit=crop&w=400&q=80' },
        { name: 'Garam Masala Premium', description: 'Authentic blend of 13 spices. Specially formulated for rich gravies.', category: 'Spices', price: 450, unit: 'kg', stock: 800, image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=400&q=80' },
        { name: 'Black Pepper Whole', description: 'Malabar black pepper, hand-picked and sun-dried. Export quality.', category: 'Spices', price: 620, unit: 'kg', stock: 600, image: 'https://images.unsplash.com/photo-1599525281488-82c2354c0044?auto=format&fit=crop&w=400&q=80' },
        { name: 'Mustard Seeds (Rai)', description: 'Small brown mustard seeds for tempering. Essential for South Indian cuisine.', category: 'Spices', price: 95, unit: 'kg', stock: 2500, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80' }
    ],
    'mumbaifresh@vendor.in': [
        { name: 'Fresh Alphonso Mangoes', description: 'Premium Ratnagiri Alphonso mangoes. Naturally ripened, export quality.', category: 'Fruits', price: 850, unit: 'dozen', stock: 200, image: 'https://images.unsplash.com/photo-1591073854185-5658e37255f8?auto=format&fit=crop&w=400&q=80' },
        { name: 'Organic Bananas', description: 'Fresh organic bananas, perfect ripeness. Sourced from Maharashtra farms.', category: 'Fruits', price: 45, unit: 'dozen', stock: 500, image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=400&q=80' },
        { name: 'Fresh Tomatoes', description: 'Firm red tomatoes, ideal for restaurants and hotels.', category: 'Vegetables', price: 35, unit: 'kg', stock: 2000, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' },
        { name: 'Premium Onions', description: 'Nashik red onions, graded and cleaned. Long shelf life.', category: 'Vegetables', price: 28, unit: 'kg', stock: 5000, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80' },
        { name: 'Fresh Green Chillies', description: 'Spicy green chillies, carefully selected for uniformity.', category: 'Vegetables', price: 65, unit: 'kg', stock: 800, image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=400&q=80' },
        { name: 'Ginger Root Fresh', description: 'Fresh ginger from Cochin. Aromatic and flavorful.', category: 'Vegetables', price: 120, unit: 'kg', stock: 1000, image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },
        { name: 'Garlic Bulbs', description: 'Premium white garlic, medium-sized bulbs. Strong flavor.', category: 'Vegetables', price: 145, unit: 'kg', stock: 1500, image: 'https://images.unsplash.com/photo-1559458920-56955030f065?auto=format&fit=crop&w=400&q=80' },
        { name: 'Fresh Potatoes', description: 'Agra potatoes, washed and graded. Perfect for chips and fries.', category: 'Vegetables', price: 25, unit: 'kg', stock: 8000, image: 'https://images.unsplash.com/photo-1518977676601-b53f82a6b69d?auto=format&fit=crop&w=400&q=80' }
    ],
    'southindiaagro@gmail.com': [
        { name: 'Filter Coffee Powder', description: 'Traditional South Indian filter coffee. 80% coffee, 20% chicory blend.', category: 'Beverages', price: 480, unit: 'kg', stock: 500, image: 'https://images.unsplash.com/photo-1611162458324-a29aa9c3629e?auto=format&fit=crop&w=400&q=80' },
        { name: 'Idli Rice', description: 'Short-grain parboiled rice, perfect for idli and dosa batter.', category: 'Grains & Rice', price: 55, unit: 'kg', stock: 4000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
        { name: 'Urad Dal Black', description: 'Whole black gram for dosa batter and vada. Premium quality.', category: 'Pulses & Lentils', price: 140, unit: 'kg', stock: 2000, image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=400&q=80' },
        { name: 'Coconut Oil (Cold Pressed)', description: 'Pure cold-pressed coconut oil from Kerala. 100% natural.', category: 'Oils', price: 220, unit: 'liter', stock: 1500, image: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=400&q=80' },
        { name: 'Curry Leaves Fresh', description: 'Fresh curry leaves, aromatic and essential for South Indian dishes.', category: 'Herbs', price: 180, unit: 'kg', stock: 300, image: 'https://images.unsplash.com/photo-1564858593457-36cb927694f2?auto=format&fit=crop&w=400&q=80' },
        { name: 'Tamarind (Imli)', description: 'Seedless tamarind paste, sour and tangy. From Tamil Nadu.', category: 'Condiments', price: 95, unit: 'kg', stock: 1200, image: 'https://images.unsplash.com/photo-1605658189766-0d4806a6669f?auto=format&fit=crop&w=400&q=80' },
        { name: 'Jaggery Powder (Gud)', description: 'Organic jaggery powder, unrefined. Natural sweetener.', category: 'Sweeteners', price: 75, unit: 'kg', stock: 2500, image: 'https://images.unsplash.com/photo-1616766432653-6a9ff2eeb623?auto=format&fit=crop&w=400&q=80' },
        { name: 'Cardamom Green (Elaichi)', description: 'Premium Coorg cardamom, bold variety. Intense aroma.', category: 'Spices', price: 2200, unit: 'kg', stock: 100, image: 'https://images.unsplash.com/photo-1559904772-02c340f12440?auto=format&fit=crop&w=400&q=80' }
    ]
};

// Generate realistic order data
function generateOrders(vendors, buyers, products) {
    const orders = [];
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const paymentMethods = ['COD', 'UPI', 'Card'];

    // Create orders for the last 3 months
    const now = new Date();

    buyers.forEach((buyer, buyerIndex) => {
        // Each buyer makes 3-8 orders
        const numOrders = 3 + Math.floor(Math.random() * 6);

        for (let i = 0; i < numOrders; i++) {
            // Random vendor
            const vendor = vendors[Math.floor(Math.random() * vendors.length)];
            const vendorProducts = products.filter(p => p.vendorId.toString() === vendor._id.toString());

            if (vendorProducts.length === 0) continue;

            // Random 1-5 products per order
            const numProducts = 1 + Math.floor(Math.random() * Math.min(5, vendorProducts.length));
            const selectedProducts = [];
            const usedIndices = new Set();

            for (let j = 0; j < numProducts; j++) {
                let idx;
                do {
                    idx = Math.floor(Math.random() * vendorProducts.length);
                } while (usedIndices.has(idx));
                usedIndices.add(idx);

                const product = vendorProducts[idx];
                const quantity = 5 + Math.floor(Math.random() * 96); // 5-100 units

                selectedProducts.push({
                    productId: product._id,
                    quantity: quantity,
                    priceAtOrder: product.price
                });
            }

            const totalAmount = selectedProducts.reduce((sum, p) => sum + (p.quantity * p.priceAtOrder), 0);

            // Random date in last 90 days
            const daysAgo = Math.floor(Math.random() * 90);
            const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

            // Status based on order age
            let status;
            if (daysAgo > 30) {
                status = Math.random() > 0.1 ? 'Delivered' : 'Cancelled';
            } else if (daysAgo > 14) {
                status = ['Shipped', 'Delivered', 'Processing'][Math.floor(Math.random() * 3)];
            } else if (daysAgo > 3) {
                status = ['Pending', 'Processing', 'Shipped'][Math.floor(Math.random() * 3)];
            } else {
                status = ['Pending', 'Processing'][Math.floor(Math.random() * 2)];
            }

            const orderId = `ORD${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orders.length + 1001).padStart(4, '0')}`;

            orders.push({
                buyerId: buyer._id,
                vendorId: vendor._id,
                products: selectedProducts,
                totalAmount: totalAmount,
                deliveryAddress: buyer.address,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                status: status,
                orderDate: orderDate,
                orderIdDisplay: orderId,
                customerName: buyer.fullName || buyer.name
            });
        }
    });

    return orders;
}

// Generate chat messages
function generateMessages(vendors, buyers) {
    const messages = [];
    const sampleConversations = [
        [
            { isFromBuyer: true, text: 'Hi, I wanted to inquire about bulk pricing for Premium Basmati Rice.' },
            { isFromBuyer: false, text: 'Hello! Thank you for reaching out. For orders above 500kg, we offer 8% discount.' },
            { isFromBuyer: true, text: 'That sounds great. What about delivery timeline?' },
            { isFromBuyer: false, text: 'For bulk orders in Delhi NCR, we can deliver within 2-3 business days.' },
            { isFromBuyer: true, text: 'Perfect. I will place an order soon. Thanks!' }
        ],
        [
            { isFromBuyer: true, text: 'Do you have Kashmiri Red Chilli in stock?' },
            { isFromBuyer: false, text: 'Yes, we have fresh stock. 1500kg available currently.' },
            { isFromBuyer: true, text: 'What is the minimum order quantity?' },
            { isFromBuyer: false, text: 'Minimum 10kg for B2B customers. Free delivery above 50kg.' }
        ],
        [
            { isFromBuyer: true, text: 'I received my order but one item was damaged during transit.' },
            { isFromBuyer: false, text: 'I apologize for the inconvenience. Can you share photos of the damaged item?' },
            { isFromBuyer: true, text: 'Sure, I will share them via WhatsApp.' },
            { isFromBuyer: false, text: 'Thank you. We will process a replacement immediately.' },
            { isFromBuyer: true, text: 'Appreciate the quick response!' }
        ],
        [
            { isFromBuyer: true, text: 'Can I get a sample before placing a large order?' },
            { isFromBuyer: false, text: 'Absolutely! We can send 1kg samples. Shipping charges apply.' },
            { isFromBuyer: true, text: 'How much for samples of 3 different spices?' },
            { isFromBuyer: false, text: 'Rs. 150 for courier charges. Sample cost will be adjusted in bulk order.' }
        ]
    ];

    // Create a few conversations between random buyer-vendor pairs
    for (let i = 0; i < 6; i++) {
        const buyer = buyers[Math.floor(Math.random() * buyers.length)];
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const conversation = sampleConversations[Math.floor(Math.random() * sampleConversations.length)];

        const conversationId = [buyer._id.toString(), vendor._id.toString()].sort().join('_');

        let messageTime = new Date(Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Last 7 days

        conversation.forEach(msg => {
            messages.push({
                conversationId: conversationId,
                from: msg.isFromBuyer ? buyer._id : vendor._id,
                to: msg.isFromBuyer ? vendor._id : buyer._id,
                text: msg.text,
                createdAt: messageTime
            });
            messageTime = new Date(messageTime.getTime() + (5 + Math.random() * 30) * 60 * 1000); // 5-35 min gap
        });
    }

    return messages;
}

// Generate notifications
function generateNotifications(vendors, buyers, orders) {
    const notifications = [];

    // Notifications for vendors
    vendors.forEach(vendor => {
        const vendorOrders = orders.filter(o => o.vendorId.toString() === vendor._id.toString());

        vendorOrders.slice(0, 5).forEach(order => {
            if (order.status === 'Pending' || order.status === 'Processing') {
                notifications.push({
                    userId: vendor._id,
                    type: 'new_order',
                    message: `New order ${order.orderIdDisplay} received from ${order.customerName}. Total: ₹${order.totalAmount.toLocaleString()}`,
                    isRead: Math.random() > 0.5,
                    relatedEntity: { id: order._id, type: 'Order' },
                    createdAt: order.orderDate
                });
            }
        });

        // Low stock notifications
        notifications.push({
            userId: vendor._id,
            type: 'low_stock',
            message: 'Some products are running low on stock. Please review your inventory.',
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        });
    });

    // Notifications for buyers
    buyers.forEach(buyer => {
        const buyerOrders = orders.filter(o => o.buyerId.toString() === buyer._id.toString());

        buyerOrders.filter(o => o.status === 'Shipped').slice(0, 2).forEach(order => {
            notifications.push({
                userId: buyer._id,
                type: 'order_shipped',
                message: `Your order ${order.orderIdDisplay} has been shipped! Expected delivery in 2-3 days.`,
                isRead: Math.random() > 0.3,
                relatedEntity: { id: order._id, type: 'Order' },
                createdAt: new Date(order.orderDate.getTime() + 2 * 24 * 60 * 60 * 1000)
            });
        });

        buyerOrders.filter(o => o.status === 'Delivered').slice(0, 2).forEach(order => {
            notifications.push({
                userId: buyer._id,
                type: 'order_delivered',
                message: `Your order ${order.orderIdDisplay} has been delivered successfully!`,
                isRead: true,
                relatedEntity: { id: order._id, type: 'Order' },
                createdAt: new Date(order.orderDate.getTime() + 5 * 24 * 60 * 60 * 1000)
            });
        });
    });

    return notifications;
}

// Main seed function
async function seedDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clear all existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await CartItem.deleteMany({});
        await Order.deleteMany({});
        await Message.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ All collections cleared\n');

        // Create vendors
        console.log('👔 Creating vendors...');
        const createdVendors = [];
        for (const vendorData of vendorsData) {
            const vendor = new User(vendorData);
            await vendor.save();
            createdVendors.push(vendor);
            console.log(`   ✓ ${vendorData.name} (${vendorData.email})`);
        }
        console.log(`✅ Created ${createdVendors.length} vendors\n`);

        // Create buyers
        console.log('🛒 Creating buyers...');
        const createdBuyers = [];
        for (const buyerData of buyersData) {
            const buyer = new User(buyerData);
            await buyer.save();
            createdBuyers.push(buyer);
            console.log(`   ✓ ${buyerData.name} (${buyerData.email})`);
        }
        console.log(`✅ Created ${createdBuyers.length} buyers\n`);

        // Create products
        console.log('📦 Creating products...');
        const createdProducts = [];
        for (const vendor of createdVendors) {
            const vendorProducts = productsData[vendor.email];
            if (vendorProducts) {
                for (const productData of vendorProducts) {
                    const product = new Product({
                        ...productData,
                        vendorId: vendor._id
                    });
                    await product.save();
                    createdProducts.push(product);
                    console.log(`   ✓ ${productData.name} (${vendor.name})`);
                }
            }
        }
        console.log(`✅ Created ${createdProducts.length} products\n`);

        // Create orders
        console.log('🧾 Creating orders...');
        const ordersData = generateOrders(createdVendors, createdBuyers, createdProducts);
        const createdOrders = [];
        for (const orderData of ordersData) {
            const order = new Order(orderData);
            await order.save();
            createdOrders.push(order);
        }
        console.log(`✅ Created ${createdOrders.length} orders\n`);

        // Create messages
        console.log('💬 Creating chat messages...');
        const messagesData = generateMessages(createdVendors, createdBuyers);
        for (const messageData of messagesData) {
            const message = new Message(messageData);
            await message.save();
        }
        console.log(`✅ Created ${messagesData.length} messages\n`);

        // Create notifications
        console.log('🔔 Creating notifications...');
        const notificationsData = generateNotifications(createdVendors, createdBuyers, createdOrders);
        for (const notificationData of notificationsData) {
            const notification = new Notification(notificationData);
            await notification.save();
        }
        console.log(`✅ Created ${notificationsData.length} notifications\n`);

        // Add some items to cart for demonstration
        console.log('🛒 Adding demo cart items...');
        const demoCartItems = [
            { userId: createdBuyers[0]._id, productId: createdProducts[0]._id, quantity: 50 },
            { userId: createdBuyers[0]._id, productId: createdProducts[6]._id, quantity: 25 },
            { userId: createdBuyers[1]._id, productId: createdProducts[10]._id, quantity: 100 },
            { userId: createdBuyers[2]._id, productId: createdProducts[15]._id, quantity: 30 }
        ];
        for (const cartData of demoCartItems) {
            const cartItem = new CartItem(cartData);
            await cartItem.save();
        }
        console.log(`✅ Created ${demoCartItems.length} cart items\n`);

        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📊 Summary:');
        console.log(`   • Vendors: ${createdVendors.length}`);
        console.log(`   • Buyers: ${createdBuyers.length}`);
        console.log(`   • Products: ${createdProducts.length}`);
        console.log(`   • Orders: ${createdOrders.length}`);
        console.log(`   • Messages: ${messagesData.length}`);
        console.log(`   • Notifications: ${notificationsData.length}`);
        console.log(`   • Cart Items: ${demoCartItems.length}\n`);

        console.log('🔐 Login Credentials (Password for all: Password123):');
        console.log('\n   VENDORS:');
        createdVendors.forEach(v => {
            console.log(`   • ${v.email}`);
        });
        console.log('\n   BUYERS:');
        createdBuyers.forEach(b => {
            console.log(`   • ${b.email}`);
        });

        console.log('\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the seed
seedDatabase();
