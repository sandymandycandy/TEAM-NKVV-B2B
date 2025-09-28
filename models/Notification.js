// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { // The user who receives the notification (vendor or buyer)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: { // e.g., 'new_order', 'low_stock', 'chat_message', 'system_alert'
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedEntity: { // Optional: reference to product, order, chat, etc.
        id: { type: mongoose.Schema.Types.ObjectId },
        type: { type: String } // 'Product', 'Order', 'Chat'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
