const express = require('express');
const router = express.Router();
const Nutrition = require('../models/Nutrition');

// Constants for calorie calculations
const BASE_CALORIES = {
    male: {
        sedentary: 2000,
        active: 2500,
        veryActive: 3000
    },
    female: {
        sedentary: 1800,
        active: 2200,
        veryActive: 2700
    }
};

// Food recommendations based on calorie needs
const FOOD_RECOMMENDATIONS = {
    lowCalorie: [
        {
            name: "Greek Yogurt with Berries",
            description: "A light and refreshing breakfast option with Greek yogurt, mixed berries, and a sprinkle of granola",
            calories: 150,
            protein: 15,
            carbs: 20,
            fats: 0
        },
        {
            name: "Grilled Chicken Salad",
            description: "Grilled chicken breast with mixed greens, cherry tomatoes, cucumber, and a light vinaigrette",
            calories: 300,
            protein: 30,
            carbs: 10,
            fats: 15
        },
        {
            name: "Baked Salmon with Vegetables",
            description: "Baked salmon fillet with steamed broccoli, carrots, and a lemon-dill sauce",
            calories: 400,
            protein: 35,
            carbs: 20,
            fats: 20
        }
    ],
    mediumCalorie: [
        {
            name: "Oatmeal with Nuts and Berries",
            description: "Steel-cut oats with mixed berries, sliced almonds, and a drizzle of honey",
            calories: 300,
            protein: 10,
            carbs: 40,
            fats: 15
        },
        {
            name: "Quinoa and Vegetable Bowl",
            description: "Quinoa bowl with roasted vegetables, chickpeas, and a tahini dressing",
            calories: 400,
            protein: 20,
            carbs: 50,
            fats: 15
        },
        {
            name: "Lean Steak with Sweet Potato",
            description: "Grilled lean steak with baked sweet potato and steamed green beans",
            calories: 500,
            protein: 40,
            carbs: 30,
            fats: 20
        }
    ],
    highCalorie: [
        {
            name: "Avocado Toast with Egg",
            description: "Whole grain toast with mashed avocado, poached egg, and a sprinkle of feta cheese",
            calories: 400,
            protein: 20,
            carbs: 30,
            fats: 25
        },
        {
            name: "Turkey and Vegetable Wrap",
            description: "Whole wheat wrap with sliced turkey breast, mixed vegetables, and hummus",
            calories: 500,
            protein: 30,
            carbs: 40,
            fats: 20
        },
        {
            name: "Beef Stir-fry with Brown Rice",
            description: "Lean beef stir-fry with mixed vegetables and brown rice",
            calories: 600,
            protein: 40,
            carbs: 50,
            fats: 25
        }
    ]
};

// Get all nutrition entries
router.get('/', async (req, res) => {
    try {
        const nutritionEntries = await Nutrition.find().sort({ date: -1 });
        res.json(nutritionEntries);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add new nutrition entry
router.post('/', async (req, res) => {
    const nutritionEntry = new Nutrition({
        name: req.body.name,
        description: req.body.description,
        calories: req.body.calories,
        protein: req.body.protein,
        carbs: req.body.carbs,
        fat: req.body.fat
    });

    try {
        const savedEntry = await nutritionEntry.save();
        res.status(201).json(savedEntry);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Update nutrition entry
router.put('/:id', async (req, res) => {
    try {
        const entry = await Nutrition.findById(req.params.id);
        if (!entry) {
            return res.status(404).send('Nutrition entry not found');
        }

        entry.name = req.body.name || entry.name;
        entry.description = req.body.description || entry.description;
        entry.calories = req.body.calories || entry.calories;
        entry.protein = req.body.protein || entry.protein;
        entry.carbs = req.body.carbs || entry.carbs;
        entry.fat = req.body.fat || entry.fat;

        const updatedEntry = await entry.save();
        res.json(updatedEntry);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Delete nutrition entry
router.delete('/:id', async (req, res) => {
    try {
        const entry = await Nutrition.findById(req.params.id);
        if (!entry) {
            return res.status(404).send('Nutrition entry not found');
        }
        await entry.remove();
        res.json({ message: 'Nutrition entry removed' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Calculate daily calories and food recommendations
router.get('/calories/:gender/:activityLevel', (req, res) => {
    try {
        const { gender, activityLevel } = req.params;
        
        // Validate input parameters
        if (!gender || !activityLevel) {
            return res.status(400).json({ 
                error: 'Gender and activity level are required'
            });
        }

        // Validate gender
        if (!BASE_CALORIES[gender]) {
            return res.status(400).json({ 
                error: 'Invalid gender. Must be either "male" or "female"'
            });
        }

        // Validate activity level
        const validActivityLevels = ['sedentary', 'active', 'veryActive'];
        if (!validActivityLevels.includes(activityLevel)) {
            return res.status(400).json({ 
                error: 'Invalid activity level. Must be one of: sedentary, active, or veryActive'
            });
        }

        const dailyCalories = BASE_CALORIES[gender][activityLevel];
        
        // Choose food recommendations based on calorie needs
        let foodRecommendations;
        if (dailyCalories < 2000) {
            foodRecommendations = FOOD_RECOMMENDATIONS.lowCalorie;
        } else if (dailyCalories < 2500) {
            foodRecommendations = FOOD_RECOMMENDATIONS.mediumCalorie;
        } else {
            foodRecommendations = FOOD_RECOMMENDATIONS.highCalorie;
        }

        // Ensure we have valid food recommendations
        if (!foodRecommendations || !Array.isArray(foodRecommendations)) {
            foodRecommendations = [
                {
                    name: "Greek Yogurt with Berries",
                    description: "A light and refreshing breakfast option with Greek yogurt, mixed berries, and a sprinkle of granola",
                    calories: 150,
                    protein: 15,
                    carbs: 20,
                    fats: 0
                },
                {
                    name: "Grilled Chicken Salad",
                    description: "Grilled chicken breast with mixed greens, cherry tomatoes, cucumber, and a light vinaigrette",
                    calories: 300,
                    protein: 30,
                    carbs: 10,
                    fats: 15
                }
            ];
        }

        res.json({
            dailyCalories,
            foodRecommendations
        });
    } catch (error) {
        console.error('Error in calorie calculation:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
