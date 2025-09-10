document.addEventListener('DOMContentLoaded', () => {
    setupCalorieCalculator();
});

// Setup calorie calculator
function setupCalorieCalculator() {
    const form = document.getElementById('calorie-form');
    form.addEventListener('submit', calculateCalories);
}

// Calculate calories based on inputs
function calculateCalories(e) {
    e.preventDefault();
    const resultDiv = document.getElementById('calorie-result');
    
    // Reset result display
    resultDiv.innerHTML = '';
    
    // Get form values
    const gender = document.getElementById('gender').value;
    const activityLevel = document.getElementById('activity-level').value;

    // Validate inputs
    if (!gender || !activityLevel) {
        resultDiv.innerHTML = '<p class="error">Please select both gender and activity level</p>';
        return;
    }

    // Show loading state
    resultDiv.innerHTML = '<p class="loading">Calculating your calorie needs...</p>';

    // Fetch personalized recommendations
    fetch(`/api/nutrition/calories/${gender}/${activityLevel}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(data => {
            // Validate response data
            if (!data || typeof data !== 'object' || 
                typeof data.dailyCalories !== 'number') {
                throw new Error('Invalid response data format');
            }

            // Use default food recommendations if none provided
            const foodRecommendations = data.foodRecommendations || [
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

            // Format the food recommendations
            const formattedRecommendations = foodRecommendations.map(food => {
                return `
                    <li>
                        <h5>${food.name}</h5>
                        <p class="description">${food.description}</p>
                        <div class="nutrition-info">
                            <p>Calories: ${food.calories} calories</p>
                            <p>Protein: ${food.protein}g</p>
                            <p>Carbs: ${food.carbs}g</p>
                            <p>Fats: ${food.fats}g</p>
                        </div>
                    </li>
                `;
            }).join('');

            // Display the results
            resultDiv.innerHTML = `
                <div class="recommendations">
                    <h3>Your Daily Calorie Needs: ${data.dailyCalories} calories</h3>
                    <div class="food-recommendations">
                        <div>
                            <h4>Food Recommendations</h4>
                            <ul>
                                ${formattedRecommendations}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error calculating calories:', error);
            resultDiv.innerHTML = `
                <div class="error">
                    <p>There was an error calculating your calorie needs:</p>
                    <p>${error.message}</p>
                    <p>Please try again or check your internet connection.</p>
                </div>
            `;
        });
}
