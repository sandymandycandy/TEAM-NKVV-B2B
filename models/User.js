// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['vendor', 'buyer'],
        required: true
    },
    // New profile fields (common for both buyer and vendor)
    fullName: { type: String },
    phone: { type: String },
    dob: { type: Date },
    address: { type: String },
    pan: { type: String }, // PAN Card Number
    gst: { type: String }, // GST Number
    aadhar: { type: String }, // Aadhar Number
    // Fields for file uploads (optional, store paths/URLs)
    fssaiCertificate: { type: String }, // Path to FSSAI certificate
    tradeLicense: { type: String },   // Path to Trade License
    profileImage: { type: String },   // Path to profile image
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare the password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
module.exports = mongoose.model('User', userSchema);
