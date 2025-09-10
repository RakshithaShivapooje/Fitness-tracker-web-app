const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Configure mongoose
        mongoose.set('strictQuery', false);
        mongoose.set('debug', true); // Enable debug logging

        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitnessapp', {
            serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log('MongoDB Database:', conn.connection.name);
        
        // Add event listeners for connection events
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

module.exports = connectDB;
