const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        required: true
    },
    protein: {
        type: Number,
        required: true
    },
    carbs: {
        type: Number,
        required: true
    },
    fat: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Nutrition', nutritionSchema);
