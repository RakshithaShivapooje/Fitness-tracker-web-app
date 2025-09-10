const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const Weight = require('../models/Weight');

// Error handling middleware
const handleError = (res, error, status = 500) => {
    console.error('API Error:', error);
    console.error('Stack:', error.stack);
    
    const response = {
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : {}
    };
    
    res.status(status).json(response);
};

// Middleware to validate weight input
const validateWeight = (req, res, next) => {
    const { weight } = req.body;
    if (!weight) {
        return handleError(res, new Error('Weight is required'), 400);
    }
    if (isNaN(weight)) {
        return handleError(res, new Error('Weight must be a number'), 400);
    }
    if (weight <= 0) {
        return handleError(res, new Error('Weight must be positive'), 400);
    }
    next();
};

// Get all workouts (history)
router.get('/', async (req, res) => {
    console.log('GET /api/workouts');
    try {
        const workouts = await Workout.find()
            .sort({ date: -1 })
            .lean(); // Convert to plain JS object
        
        console.log('Found workouts:', workouts);
        
        // Ensure workouts is always an array
        const workoutArray = Array.isArray(workouts) ? workouts : [workouts];
        
        // Format each workout
        const formattedWorkouts = workoutArray.map(workout => ({
            ...workout,
            date: workout.date.toISOString().split('T')[0]
        }));
        
        res.json({
            success: true,
            data: formattedWorkouts
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Get workout history (same as GET /)
router.get('/history', (req, res) => {
    res.redirect('/api/workouts');
});

// Add new workout
router.post('/', async (req, res) => {
    console.log('POST /api/workouts', req.body);
    try {
        const { exercise, calories, sets, reps, weight } = req.body;
        
        if (!exercise) {
            console.log('Exercise is required');
            return handleError(res, new Error('Exercise name is required'), 400);
        }

        if (!calories) {
            console.log('Calories are required');
            return handleError(res, new Error('Calories burned is required'), 400);
        }

        const workout = new Workout({
            exercise,
            calories: parseFloat(calories),
            sets: sets ? parseInt(sets) : undefined,
            reps: reps ? parseInt(reps) : undefined,
            weight: weight ? parseFloat(weight) : undefined
        });

        await workout.save();
        console.log('Workout saved:', workout);
        
        // Format the response
        const formattedWorkout = {
            ...workout.toObject(),
            date: workout.date.toISOString().split('T')[0]
        };

        res.status(201).json({
            success: true,
            data: formattedWorkout
        });
    } catch (err) {
        console.error('Error in POST /workouts:', err);
        handleError(res, err);
    }
});

// Delete workout
router.delete('/:id', async (req, res) => {
    console.log('DELETE /api/workouts/:id', req.params.id);
    try {
        // Delete the workout directly
        const result = await Workout.deleteOne({ _id: req.params.id });
        
        if (result.deletedCount === 0) {
            console.log('Workout not found');
            return handleError(res, new Error('Workout not found'), 404);
        }

        console.log('Workout deleted successfully');
        
        res.json({
            success: true,
            message: 'Workout deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting workout:', err);
        handleError(res, err);
    }
});

// Get weight history
router.get('/weight-history', async (req, res) => {
    console.log('GET /api/workouts/weight-history');
    try {
        // Get weight history with timestamps
        const weightHistory = await Weight.find()
            .sort({ date: 1 })
            .select('weight date') // Only select weight and date fields
            .lean(); // Convert to plain JS object

        console.log('Weight history:', weightHistory);
        
        // Add formatted date for display
        const formattedHistory = weightHistory.map(entry => ({
            ...entry,
            date: entry.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            formattedWeight: `${entry.weight.toFixed(1)} kg`
        }));

        res.json({
            success: true,
            data: formattedHistory
        });
    } catch (err) {
        console.error('Error in GET /weight-history:', err);
        handleError(res, err);
    }
});

// Add new weight entry
router.post('/weight', validateWeight, async (req, res) => {
    console.log('POST /api/workouts/weight', req.body);
    try {
        const weightEntry = new Weight({
            weight: Number(req.body.weight)
        });

        await weightEntry.save();
        console.log('Weight entry saved:', weightEntry);
        
        // Format the response
        const formattedEntry = {
            ...weightEntry.toObject(),
            date: weightEntry.date.toISOString().split('T')[0],
            formattedWeight: `${weightEntry.weight.toFixed(1)} kg`
        };

        res.status(201).json({
            success: true,
            data: formattedEntry
        });
    } catch (err) {
        console.error('Error in POST /weight:', err);
        handleError(res, err);
    }
});

module.exports = router;
