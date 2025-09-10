// Fetch exercises from backend
async function fetchExercises() {
    try {
        const response = await fetch('/api/exercises');
        const exercises = await response.json();
        displayExercises(exercises);
    } catch (error) {
        console.error('Error fetching exercises:', error);
    }
}

// Display exercises in grid
function displayExercises(exercises) {
    const exerciseList = document.getElementById('exercise-list');
    if (!exerciseList) return;

    exerciseList.innerHTML = exercises.map(exercise => `
        <div class="exercise-card">
            <h3>${exercise.name}</h3>
            <p>Muscle Group: ${exercise.muscleGroup}</p>
            <p>Difficulty: ${exercise.difficulty}</p>
            <p>${exercise.description}</p>
        </div>
    `).join('');
}

// Calculate BMI
function calculateBMI() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const resultDiv = document.getElementById('bmi-result');

    if (weight && height) {
        const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
        let category = '';

        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal weight';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obesity';

        resultDiv.innerHTML = `
            <p>Your BMI is: ${bmi}</p>
            <p>Category: ${category}</p>
        `;
    } else {
        resultDiv.innerHTML = 'Please enter both weight and height';
    }
}

// Fetch nutrition data
async function fetchNutritionData() {
    try {
        const response = await fetch('/api/nutrition');
        const data = await response.json();
        displayNutritionData(data);
    } catch (error) {
        console.error('Error fetching nutrition data:', error);
    }
}

// Display nutrition data
function displayNutritionData(data) {
    const nutritionList = document.getElementById('nutrition-list');
    if (!nutritionList) return;

    nutritionList.innerHTML = data.map(item => `
        <div class="nutrition-item">
            <h4>${item.name}</h4>
            <p>Calories: ${item.calories}</p>
            <p>Protein: ${item.protein}g</p>
            <p>Carbs: ${item.carbs}g</p>
            <p>Fat: ${item.fat}g</p>
        </div>
    `).join('');
}

// Load default nutrition values
function loadDefaultNutritionValues() {
    const baseCalories = 2000;
    
    document.getElementById('daily-calories').textContent = baseCalories;
    document.getElementById('daily-protein').textContent = Math.round(baseCalories * 0.2 / 4);
    document.getElementById('daily-carbs').textContent = Math.round(baseCalories * 0.5 / 4);
    document.getElementById('daily-fats').textContent = Math.round(baseCalories * 0.3 / 9);
}

// Quick calorie calculator
function quickCalculateCalories() {
    const age = document.getElementById('quick-age').value;
    const gender = document.getElementById('quick-gender').value;
    const resultDiv = document.getElementById('quick-result');

    if (age && gender) {
        let calories;
        if (gender === 'male') {
            calories = 66 + (13.7 * 70) + (5 * 175) - (6.8 * age);
        } else {
            calories = 655 + (9.6 * 60) + (1.8 * 170) - (4.7 * age);
        }
        resultDiv.innerHTML = `Estimated daily calories: ${Math.round(calories)} kcal`;
    } else {
        resultDiv.innerHTML = 'Please enter age and select gender';
    }
}

let ws = null;

// Initialize WebSocket connection
function initWebSocket() {
    ws = new WebSocket('ws://' + window.location.host);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        // Initial fetch of workouts
        fetchWorkouts();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'workout-update') {
            fetchWorkouts();
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 2 seconds
        setTimeout(initWebSocket, 2000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Fetch workouts from backend
async function fetchWorkouts() {
    try {
        const response = await fetch('/api/workouts');
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            console.error('Error fetching workouts:', data.message || 'Failed to fetch workouts');
            return;
        }

        displayWorkouts(data.data);
    } catch (error) {
        console.error('Error fetching workouts:', error);
    }
}

// Display workouts
function displayWorkouts(workouts) {
    const workoutPlan = document.getElementById('workout-plan');
    if (!workoutPlan) return;

    if (!workouts || workouts.length === 0) {
        workoutPlan.innerHTML = '<p>No workouts added yet</p>';
        return;
    }

    workoutPlan.innerHTML = workouts.map(workout => `
        <div class="workout-item">
            <h4>${workout.exercise}</h4>
            <p>Sets: ${workout.sets || 'N/A'}</p>
            <p>Reps: ${workout.reps || 'N/A'}</p>
            <p>Weight: ${workout.weight ? `${workout.weight} kg` : 'N/A'}</p>
            <p>Calories: ${workout.calories} kcal</p>
            <p>Date: ${new Date(workout.date).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    fetchExercises();
    fetchNutritionData();
    loadDefaultNutritionValues();
});
