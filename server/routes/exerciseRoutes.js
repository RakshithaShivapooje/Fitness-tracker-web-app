const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');

// Get all exercises
router.get('/', async (req, res) => {
    try {
        const exercises = await Exercise.find().sort({ date: -1 });
        res.json(exercises);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add new exercise
router.post('/', async (req, res) => {
    const exercise = new Exercise({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        duration: req.body.duration,
        caloriesBurned: req.body.caloriesBurned
    });

    try {
        const savedExercise = await exercise.save();
        res.status(201).json(savedExercise);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Update exercise
router.put('/:id', async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) {
            return res.status(404).send('Exercise not found');
        }

        exercise.name = req.body.name || exercise.name;
        exercise.description = req.body.description || exercise.description;
        exercise.type = req.body.type || exercise.type;
        exercise.duration = req.body.duration || exercise.duration;
        exercise.caloriesBurned = req.body.caloriesBurned || exercise.caloriesBurned;

        const updatedExercise = await exercise.save();
        res.json(updatedExercise);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Delete exercise
router.delete('/:id', async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) {
            return res.status(404).send('Exercise not found');
        }
        await exercise.remove();
        res.json({ message: 'Exercise removed' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
