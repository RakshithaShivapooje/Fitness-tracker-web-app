let ws = null;

// Initialize WebSocket connection
function initWebSocket() {
    // Get the protocol (http or https)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        // Initial fetch of workouts
        loadWorkouts();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'workout-update') {
            loadWorkouts();
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 2 seconds
        setTimeout(initWebSocket, 2000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Try to reconnect after 2 seconds
        setTimeout(initWebSocket, 2000);
    };
}

// Load workouts from server
async function loadWorkouts() {
    try {
        console.log('Loading workouts...');
        const response = await fetch('/api/workouts');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to load workouts');
        }
        
        const data = await response.json();
        console.log('Workouts loaded:', data);
        displayWorkouts(data.data);
    } catch (error) {
        console.error('Error loading workouts:', error);
        showErrorMessage(error.message || 'Error loading workouts');
    }
}

// Display workouts
function displayWorkouts(workouts) {
    const workoutList = document.getElementById('workout-list');
    if (!workoutList) {
        console.error('Workout list container not found');
        showErrorMessage('Error: Workout list container not found');
        return;
    }

    if (!workouts || workouts.length === 0) {
        workoutList.innerHTML = '<p>No workouts added yet</p>';
        return;
    }

    workoutList.innerHTML = workouts.map(workout => `
        <div class="workout-item" data-workout-id="${workout._id}">
            <h4>${workout.exercise}</h4>
            <p>Sets: ${workout.sets || 'N/A'}</p>
            <p>Reps: ${workout.reps || 'N/A'}</p>
            <p>Weight: ${workout.weight ? `${workout.weight} kg` : 'N/A'}</p>
            <p>Calories: ${workout.calories} kcal</p>
            <p>Date: ${new Date(workout.date).toLocaleDateString()}</p>
            <button class="remove-workout">Remove</button>
        </div>
    `).join('');

    // Setup remove buttons after updating the DOM
    setupRemoveButtons();
}

// Setup workout form
function setupWorkoutForm() {
    const form = document.getElementById('workout-form');
    if (!form) {
        console.error('Could not find workout form');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addWorkout();
    });
}

// Setup remove buttons
function setupRemoveButtons() {
    // First remove existing event listeners
    const existingButtons = document.querySelectorAll('.remove-workout');
    existingButtons.forEach(button => {
        button.removeEventListener('click', removeWorkoutHandler);
    });

    // Then add new event listeners
    const removeButtons = document.querySelectorAll('.remove-workout');
    removeButtons.forEach(button => {
        button.addEventListener('click', removeWorkoutHandler);
    });
}

// Remove workout handler
async function removeWorkoutHandler(event) {
    console.log('Remove button clicked');
    event.preventDefault();
    const button = event.target;
    const workoutDiv = button.closest('.workout-item');
    
    if (!workoutDiv) {
        console.error('No workout item found');
        showErrorMessage('Error: Workout item not found');
        return;
    }

    const workoutId = workoutDiv.dataset.workoutId;
    if (!workoutId) {
        console.error('No workout ID found');
        showErrorMessage('Error: Workout ID not found');
        return;
    }

    console.log('Found workout ID:', workoutId);

    try {
        console.log('Attempting to delete workout:', workoutId);
        const response = await fetch(`/api/workouts/${workoutId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Server response:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to remove workout');
        }

        console.log('Workout deletion successful');
        // Remove workout from DOM immediately
        workoutDiv.remove();
        
        // Notify other clients
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'workout-update'
            }));
            console.log('Sent workout update notification via WebSocket');
        }

        // Reload workouts to ensure everything is up to date
        loadWorkouts();
        showSuccessMessage('Workout removed successfully!');
        console.log('Workout removed successfully');
    } catch (error) {
        console.error('Error removing workout:', error);
        showErrorMessage(error.message || 'Error removing workout. Please try again.');
        // Re-add the event listener in case it was removed
        button.addEventListener('click', removeWorkoutHandler);
    }
}

// Add new workout
async function addWorkout() {
    const exercise = document.getElementById('exercise').value;
    const sets = parseInt(document.getElementById('sets').value);
    const reps = parseInt(document.getElementById('reps').value);
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    
    if (!exercise || !sets || !reps) {
        showErrorMessage('Please fill in exercise, sets, and reps');
        return;
    }

    try {
        // Calculate calories
        const calories = calculateCalories(sets, reps, weight);
        
        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                exercise, 
                sets, 
                reps, 
                weight,
                calories
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to add workout');
        }

        // Notify other clients
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'workout-update'
            }));
        }

        loadWorkouts();
        document.getElementById('workout-form').reset();
        showSuccessMessage('Workout added successfully!');
    } catch (error) {
        console.error('Error adding workout:', error);
        showErrorMessage(error.message || 'Error adding workout. Please try again.');
    }
}

// Calculate calories burned based on exercise intensity
function calculateCalories(sets, reps, weight) {
    // Basic formula: calories = (sets * reps * weight) * 0.03
    // If weight is not provided, use a default intensity factor
    const intensityFactor = weight > 0 ? 0.03 : 0.01;
    return Math.round((sets * reps * weight) * intensityFactor);
}

// Update progress charts
async function updateProgressCharts() {
    try {
        // Get weight history from workouts
        const weightResponse = await fetch('/api/workouts/weight-history');
        if (!weightResponse.ok) throw new Error('Failed to load weight history');
        const weightHistory = await weightResponse.json();
        
        // Get workout history
        const workoutResponse = await fetch('/api/workouts/history');
        if (!workoutResponse.ok) throw new Error('Failed to load workout history');
        const workoutHistory = await workoutResponse.json();
        
        // Update weight chart
        const weightCtx = document.getElementById('weight-chart')?.getContext('2d');
        if (weightCtx) {
            new Chart(weightCtx, {
                type: 'line',
                data: {
                    labels: weightHistory.map(w => new Date(w.date).toLocaleDateString()),
                    datasets: [{
                        label: 'Weight (kg)',
                        data: weightHistory.map(w => w.weight),
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Update workout chart
        const workoutCtx = document.getElementById('workout-chart')?.getContext('2d');
        if (workoutCtx) {
            new Chart(workoutCtx, {
                type: 'line',
                data: {
                    labels: workoutHistory.map(w => new Date(w.date).toLocaleDateString()),
                    datasets: [{
                        label: 'Calories Burned',
                        data: workoutHistory.map(w => w.calories),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadWorkouts();
    setupWorkoutForm();
    setupRemoveButtons();
});
