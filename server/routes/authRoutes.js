const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Error handling middleware
const handleError = (res, error, status = 500) => {
    console.error('Auth Error:', error);
    console.error('Stack:', error.stack);
    
    const response = {
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : {}
    };
    
    res.status(status).json(response);
};

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return handleError(res, new Error('All fields are required'), 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return handleError(res, new Error('Username or email already exists'), 400);
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return handleError(res, new Error('Username and password are required'), 400);
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return handleError(res, new Error('Invalid username or password'), 401);
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return handleError(res, new Error('Invalid username or password'), 401);
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        handleError(res, error);
    }
});

module.exports = router;
