const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Strength', 'Cardio', 'Flexibility', 'Other'],
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    caloriesBurned: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
