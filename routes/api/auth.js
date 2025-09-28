// routes/api/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Import the User model

// Get the JWT secret from environment variables
const jwtSecret = process.env.JWT_SECRET;

// GET /api/user/:id - get user info (name, role)
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name role');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/signup
// Handles new user registration
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Create a new user instance
        user = new User({ name, email, password, role });
        await user.save(); // The password hashing is handled by the pre-save middleware

        // Respond with success
        res.status(201).json({ success: true, message: 'User registered successfully!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// POST /api/login
// Handles user login and returns a JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Create a payload for the JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Sign the JWT
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;

                // Determine redirect URL based on user role
                let redirectTo = '/buyer-dashboard.html';
                if (user.role === 'vendor') {
                    redirectTo = '/vendor-dashboard.html';
                }

                // Respond with the token, user role, and redirect URL
                res.json({ success: true, token, role: user.role, redirectTo });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

module.exports = router;
