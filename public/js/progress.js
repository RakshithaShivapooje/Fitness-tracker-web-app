document.addEventListener('DOMContentLoaded', () => {
    console.log('Progress page loaded');
    loadProgressData();
});

let workoutChart;
let weightChart;

// Load progress data from server
async function loadProgressData() {
    console.log('Loading progress data...');
    try {
        // Load workout history
        const workoutResponse = await fetch('/api/workouts');
        console.log('Workout response:', workoutResponse);
        
        if (!workoutResponse.ok) {
            throw new Error(`HTTP error! status: ${workoutResponse.status}`);
        }
        
        const workoutText = await workoutResponse.text();
        console.log('Workout response text:', workoutText);
        
        try {
            const workouts = JSON.parse(workoutText);
            console.log('Parsed workouts:', workouts);
            
            if (!workouts.success) {
                throw new Error(workouts.message || 'Failed to load workout history');
            }

            // Load weight history
            const weightResponse = await fetch('/api/workouts/weight-history');
            console.log('Weight response:', weightResponse);
            
            if (!weightResponse.ok) {
                throw new Error(`HTTP error! status: ${weightResponse.status}`);
            }
            
            const weightText = await weightResponse.text();
            console.log('Weight response text:', weightText);
            
            try {
                const weightHistory = JSON.parse(weightText);
                console.log('Parsed weight history:', weightHistory);
                
                if (!weightHistory.success) {
                    throw new Error(weightHistory.message || 'Failed to load weight history');
                }

                // Initialize charts
                initializeWorkoutChart(workouts.data);
                initializeWeightChart(weightHistory.data);
            } catch (parseError) {
                console.error('Error parsing weight history:', parseError);
                throw new Error('Failed to parse weight history');
            }
        } catch (parseError) {
            console.error('Error parsing workout history:', parseError);
            throw new Error('Failed to parse workout history');
        }
    } catch (error) {
        console.error('Error loading progress data:', error);
        showErrorMessage(error.message || 'Error loading progress data. Please try again later.');
    }
}

// Initialize workout progress chart
function initializeWorkoutChart(workouts) {
    try {
        const workoutCtx = document.getElementById('workout-chart');
        if (!workoutCtx) {
            throw new Error('Workout chart canvas not found');
        }

        const ctx = workoutCtx.getContext('2d');
        if (workoutChart) workoutChart.destroy();

        // Sort workouts by date
        workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Extract data for chart
        const dates = workouts.map(workout => new Date(workout.date).toLocaleDateString());
        const calories = workouts.map(workout => workout.calories || 0);
        const exercises = workouts.map(workout => workout.exercise);

        // Create workout chart
        workoutChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Calories Burned',
                    data: calories,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calories Burned'
                        },
                        ticks: {
                            stepSize: 100,
                            precision: 0
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Workout Progress Over Time'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const calories = context.raw;
                                return `${calories} calories`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing workout chart:', error);
        showErrorMessage('Error initializing workout chart. Please refresh the page.');
    }
}

// Initialize weight progress chart
function initializeWeightChart(weightData) {
    try {
        const weightCtx = document.getElementById('weight-chart');
        if (!weightCtx) {
            throw new Error('Weight chart canvas not found');
        }

        const ctx = weightCtx.getContext('2d');
        if (weightChart) weightChart.destroy();

        // Sort weight history by date
        weightData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Extract data for chart
        const dates = weightData.map(weight => new Date(weight.date).toLocaleDateString());
        const weights = weightData.map(weight => weight.weight);

        // Create weight chart
        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Weight (kg)',
                    data: weights,
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Weight (kg)'
                        },
                        ticks: {
                            stepSize: 1,
                            precision: 1
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Weight Progress Over Time'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const weight = context.raw;
                                return `${weight.toFixed(1)} kg`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing weight chart:', error);
        showErrorMessage('Error initializing weight chart. Please refresh the page.');
    }
}

// Add new weight entry
async function addWeightEntry() {
    console.log('Adding weight entry...');
    const weight = document.getElementById('weight-input').value;
    
    if (!weight) {
        showErrorMessage('Please enter a weight value');
        return;
    }

    try {
        console.log('Sending weight:', weight);
        const response = await fetch('/api/workouts/weight', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ weight: parseFloat(weight) })
        });
        
        console.log('Weight response:', response);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Weight response text:', responseText);
        
        try {
            const data = JSON.parse(responseText);
            console.log('Parsed response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to add weight entry');
            }

            // Refresh charts
            loadProgressData();
            document.getElementById('weight-input').value = '';
            showSuccessMessage('Weight added successfully!');
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Failed to parse response');
        }
    } catch (error) {
        console.error('Error adding weight:', error);
        showErrorMessage(error.message || 'Error adding weight entry. Please try again.');
    }
}

// Add new workout entry
async function addWorkoutEntry() {
    console.log('Adding workout entry...');
    const workoutName = document.getElementById('workout-name').value;
    const calories = document.getElementById('calories-input').value;
    
    if (!workoutName || !calories) {
        showErrorMessage('Please enter both workout name and calories burned');
        return;
    }

    try {
        console.log('Sending workout:', { workoutName, calories });
        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                exercise: workoutName,
                calories: parseFloat(calories)
            })
        });
        
        console.log('Workout response:', response);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Workout response text:', responseText);
        
        try {
            const data = JSON.parse(responseText);
            console.log('Parsed response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to add workout entry');
            }

            // Refresh charts
            loadProgressData();
            document.getElementById('workout-name').value = '';
            document.getElementById('calories-input').value = '';
            showSuccessMessage('Workout added successfully!');
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Failed to parse response');
        }
    } catch (error) {
        console.error('Error adding workout:', error);
        showErrorMessage(error.message || 'Error adding workout entry. Please try again.');
    }
}

// Show error message
function showErrorMessage(message) {
    console.error('Showing error:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccessMessage(message) {
    console.log('Showing success:', message);
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    // Remove success after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}
