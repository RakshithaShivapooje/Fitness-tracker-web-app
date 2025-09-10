const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({
    weight: {
        type: Number,
        required: [true, 'Weight is required'],
        min: [0, 'Weight must be positive'],
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Weight must be a positive number'
        }
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add virtual for formatted weight
weightSchema.virtual('formattedWeight').get(function() {
    return `${this.weight.toFixed(1)} kg`;
});

// Add validation middleware
weightSchema.pre('validate', function(next) {
    if (this.weight <= 0) {
        this.invalidate('weight', 'Weight must be greater than 0');
    }
    next();
});

module.exports = mongoose.model('Weight', weightSchema);
