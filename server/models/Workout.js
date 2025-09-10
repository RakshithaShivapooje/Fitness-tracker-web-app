const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    exercise: {
        type: String,
        trim: true
    },
    sets: {
        type: Number,
        min: [1, 'Sets must be at least 1'],
        default: 1
    },
    reps: {
        type: Number,
        min: [1, 'Reps must be at least 1'],
        default: 1
    },
    weight: {
        type: Number,
        min: [0, 'Weight must be positive'],
        default: 0
    },
    calories: {
        type: Number,
        required: [true, 'Calories are required']
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Calculate calories based on exercise parameters if not provided
workoutSchema.pre('save', function(next) {
    if (!this.isModified('exercise') && !this.isModified('sets') && !this.isModified('reps') && !this.isModified('weight')) {
        return next();
    }
    
    // Calculate calories if not provided
    if (!this.calories) {
        // Simple formula: calories = (sets * reps * weight) * 0.03
        this.calories = Math.round((this.sets * this.reps * this.weight) * 0.03);
    }
    
    next();
});

module.exports = mongoose.model('Workout', workoutSchema);
