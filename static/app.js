// app.js

// Global variables
let currentCityName = '';
let currentLatitude = null;
let currentLongitude = null;

// Initialize Leaflet map and set default view
var map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19
}).addTo(map);
var customMarkerIcon = L.divIcon({className: 'custom-map-marker', html: '', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12]});
var marker = L.marker([0, 0], { icon: customMarkerIcon }).addTo(map);

// --- Date Helper Functions ---
function getFormattedDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getTomorrowsDateString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getFormattedDate(tomorrow);
}

// --- Feedback Helper ---
function displayAppFeedback(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = 'feedback-message'; // Reset classes
    if (type === 'success') {
        element.classList.add('feedback-success');
    } else if (type === 'error') {
        element.classList.add('feedback-error');
    }
    element.style.display = 'block';
    element.classList.add('show');

    setTimeout(() => {
        element.classList.remove('show');
        setTimeout(() => {
            if (!element.classList.contains('show')) {
                 element.style.display = 'none';
            }
        }, 500);
    }, 3000);
}

// --- Moved showLoadingState here ---
function showLoadingState() {
    const weatherInfoCard = document.querySelector('.weather-info-js');
    const errorJs = document.getElementById('error-message-js');
    if(errorJs) {
        errorJs.textContent = '';
        errorJs.style.display = 'none'; 
    }
    if (weatherInfoCard) {
        weatherInfoCard.classList.add('weather-data-loading');
    }
    const cityNameEl = document.getElementById('city-name');
    if(cityNameEl) cityNameEl.textContent = ''; 
    const tempEl = document.getElementById('temperature');
    if(tempEl) tempEl.textContent = '';
    const descEl = document.getElementById('description');
    if(descEl) descEl.textContent = '';
    const humidityEl = document.getElementById('humidity');
    if(humidityEl) humidityEl.textContent = '';
    const pressureEl = document.getElementById('pressure');
    if(pressureEl) pressureEl.textContent = '';
    const windSpeedEl = document.getElementById('wind-speed');
    if(windSpeedEl) windSpeedEl.textContent = '';
    const weatherIconEl = document.getElementById('weather-icon');
    if(weatherIconEl) weatherIconEl.className = 'fas';
    // Hide AI summary during loading
    hideAiSummary();
}

function getWeatherIconClass(weatherId, weatherMain, description) {
    const desc = description ? description.toLowerCase() : '';
    weatherMain = weatherMain ? weatherMain.toLowerCase() : '';

    if (weatherId >= 200 && weatherId <= 232) return 'fa-bolt'; // Thunderstorm
    if (weatherId >= 300 && weatherId <= 321) return 'fa-cloud-rain'; // Drizzle
    if (weatherId >= 500 && weatherId <= 504) return 'fa-cloud-showers-heavy'; // Rain
    if (weatherId === 511) return 'fa-snowflake'; // Freezing Rain (Snowflake icon)
    if (weatherId >= 520 && weatherId <= 531) return 'fa-cloud-rain'; // Shower Rain
    if (weatherId >= 600 && weatherId <= 622) return 'fa-snowflake'; // Snow
    if (weatherId >= 701 && weatherId <= 781) return 'fa-smog'; // Atmosphere (Mist, Smoke, Haze, etc.)
    if (weatherId === 800) return 'fa-sun'; // Clear
    if (weatherId === 801) return 'fa-cloud-sun'; // Few clouds
    if (weatherId === 802) return 'fa-cloud'; // Scattered clouds
    if (weatherId === 803 || weatherId === 804) return 'fa-cloud-meatball'; // Broken/Overcast clouds

    if (weatherMain === 'thunderstorm') return 'fa-bolt';
    if (weatherMain === 'drizzle') return 'fa-cloud-rain';
    if (weatherMain === 'rain') return 'fa-cloud-showers-heavy';
    if (weatherMain === 'snow') return 'fa-snowflake';
    if (weatherMain === 'clear') return 'fa-sun';
    if (weatherMain === 'clouds') return 'fa-cloud';
    if (desc.includes('smoke') || desc.includes('haze') || desc.includes('dust') || desc.includes('sand') || desc.includes('ash')) return 'fa-smog';
    if (desc.includes('fog') || desc.includes('mist')) return 'fa-smog';
    if (desc.includes('squall') || desc.includes('tornado')) return 'fa-wind';

    return 'fa-question-circle';
}

function updatePopup(weatherData) {
    if (!marker || !weatherData) return;
    const iconClass = getWeatherIconClass(weatherData.weather_id, weatherData.weather_main, weatherData.description);
    const popupContent = `
        <h3><i class="fas ${iconClass}"></i> ${weatherData.city}</h3>
        <p>Temperature: ${Math.round(weatherData.temperature)}°C</p>
        <p>Description: ${weatherData.description}</p>
        <p>Humidity: ${weatherData.humidity}%</p>
        <p>Pressure: ${weatherData.pressure} hPa</p>
        <p>Wind Speed: ${weatherData.wind_speed} m/s</p>
    `;
    marker.setPopupContent(popupContent).openPopup();
}

// DOM Element References
const healthAdviceModal = document.getElementById('health-advice-modal');
const modalCloseBtn = document.querySelector('#health-advice-modal .modal-close-btn');
const modalCitySummary = document.getElementById('modal-city-summary');
const modalBody = document.getElementById('modal-body');
const modalDisclaimer = document.getElementById('modal-disclaimer');
const predictionCityNameEl = document.getElementById('prediction-city-name');
const maxTempPredictionInputEl = document.getElementById('max-temp-prediction-input');
const submitPredictionBtnEl = document.getElementById('submit-prediction-btn');
const predictionFeedbackMsgEl = document.getElementById('prediction-feedback-msg');
const predictionsListEl = document.getElementById('predictions-list');
const activityButton = document.getElementById('get-activity-forecast-btn');
const activityResultsDiv = document.getElementById('activity-forecast-results');
const activityErrorDiv = document.getElementById('activity-forecast-error');
const healthAdviceButton = document.getElementById('get-health-advice-btn');
const healthErrorDiv = document.getElementById('health-advice-error');
const historyCityNameEl = document.getElementById('history-city-name');
const getHistoryBtnEl = document.getElementById('get-history-btn');
const historicalDisplayAreaEl = document.getElementById('historical-weather-display-area');
const historyFeedbackMsgEl = document.getElementById('history-feedback-msg');

function updateWeatherDisplay(weatherData) {
    const weatherInfoCard = document.querySelector('.weather-info-js');
    const weatherIconElement = document.getElementById('weather-icon');
    const determinedIconClass = getWeatherIconClass(weatherData.weather_id, weatherData.weather_main, weatherData.description);
    if(weatherIconElement) weatherIconElement.className = 'fas ' + determinedIconClass; 

    currentCityName = weatherData.city || ''; 
    currentLatitude = weatherData.latitude; 
    currentLongitude = weatherData.longitude; 

    const cityNameEl = document.getElementById('city-name');
    if (cityNameEl) cityNameEl.textContent = currentCityName; 

    if (predictionCityNameEl) predictionCityNameEl.textContent = currentCityName;
    if (maxTempPredictionInputEl) maxTempPredictionInputEl.disabled = !currentCityName;
    if (submitPredictionBtnEl) submitPredictionBtnEl.disabled = !currentCityName;
    
    if (historyCityNameEl) historyCityNameEl.textContent = currentCityName;
    if (getHistoryBtnEl) getHistoryBtnEl.disabled = (!currentLatitude || !currentLongitude);

    const temp = weatherData.temperature !== undefined ? Math.round(weatherData.temperature) : '';
    const tempEl = document.getElementById('temperature');
    if (tempEl) tempEl.textContent = temp; 
    
    const descEl = document.getElementById('description');
    if(descEl) descEl.textContent = weatherData.description || '';

    const humidityEl = document.getElementById('humidity');
    if(humidityEl) humidityEl.textContent = weatherData.humidity !== undefined ? weatherData.humidity : '';

    const pressureEl = document.getElementById('pressure');
    if(pressureEl) pressureEl.textContent = weatherData.pressure !== undefined ? weatherData.pressure : '';

    const windSpeedEl = document.getElementById('wind-speed');
    if(windSpeedEl) windSpeedEl.textContent = weatherData.wind_speed !== undefined ? weatherData.wind_speed : '';

    if (weatherInfoCard) { weatherInfoCard.classList.remove('weather-data-loading'); }
    if (activityResultsDiv) activityResultsDiv.innerHTML = '';
    if (activityErrorDiv) { activityErrorDiv.textContent = ''; activityErrorDiv.style.display = 'none'; }
    if (healthErrorDiv) { healthErrorDiv.textContent = ''; healthErrorDiv.style.display = 'none'; }
    if (healthAdviceModal && healthAdviceModal.classList.contains('show')) { healthAdviceModal.classList.remove('show'); } 
    if (predictionFeedbackMsgEl) { displayAppFeedback(predictionFeedbackMsgEl, '', 'clear'); }
    if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '';
    if (historyFeedbackMsgEl) { displayAppFeedback(historyFeedbackMsgEl, '', 'clear'); }
    // AI summary is handled in getWeather or displayError
}

// --- AI Weather Summary Functions ---
async function getAiWeatherSummary(promptText) {
    const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptText }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch if error response is not JSON
        throw new Error(errorData.error || `AI summary generation failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.summary;
}

function displayAiSummary(summaryText) {
    const aiSummaryTextEl = document.getElementById('ai-summary-text');
    const aiSummaryCardEl = document.getElementById('ai-summary-card');
    if (aiSummaryTextEl && aiSummaryCardEl) {
        aiSummaryTextEl.textContent = summaryText;
        aiSummaryCardEl.style.display = 'block';
    }
}

function hideAiSummary() {
    const aiSummaryTextEl = document.getElementById('ai-summary-text');
    const aiSummaryCardEl = document.getElementById('ai-summary-card');
    if (aiSummaryCardEl) {
        aiSummaryCardEl.style.display = 'none';
    }
    if (aiSummaryTextEl) {
        aiSummaryTextEl.textContent = ''; // Clear previous summary
    }
}
// --- End AI Weather Summary Functions ---

function displayError(message) {
    const errorDiv = document.getElementById('error-message-js');
    const weatherInfoCard = document.querySelector('.weather-info-js');
    if (errorDiv) {
      errorDiv.style.display = 'block'; 
      errorDiv.textContent = message || "An unexpected error occurred. Please try again.";
    }
    
    currentCityName = ''; 
    currentLatitude = null;
    currentLongitude = null;

    const UIElementsToClear = ['city-name', 'temperature', 'description', 'humidity', 'pressure', 'wind-speed'];
    UIElementsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIconEl) weatherIconEl.className = 'fas'; 

    if (predictionCityNameEl) predictionCityNameEl.textContent = 'No city selected';
    if (maxTempPredictionInputEl) maxTempPredictionInputEl.disabled = true;
    if (submitPredictionBtnEl) submitPredictionBtnEl.disabled = true;
    if (predictionFeedbackMsgEl) { displayAppFeedback(predictionFeedbackMsgEl, '', 'clear'); }
    
    if (historyCityNameEl) historyCityNameEl.textContent = 'No city selected';
    if (getHistoryBtnEl) getHistoryBtnEl.disabled = true;
    if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '';
    if (historyFeedbackMsgEl) { displayAppFeedback(historyFeedbackMsgEl, '', 'clear'); }

    if (weatherInfoCard) { weatherInfoCard.classList.remove('weather-data-loading'); }
    if (activityResultsDiv) activityResultsDiv.innerHTML = '';
    if (activityErrorDiv) { activityErrorDiv.textContent = ''; activityErrorDiv.style.display = 'none'; }
    if (healthErrorDiv) { healthErrorDiv.textContent = ''; healthErrorDiv.style.display = 'none'; }
    if (healthAdviceModal && healthAdviceModal.classList.contains('show')) { healthAdviceModal.classList.remove('show'); }

    // Hide AI summary on error
    hideAiSummary();
}


// --- Daily Prediction Challenge Logic ---
function displayStoredPredictions() { 
    if (!predictionsListEl) return;
    predictionsListEl.innerHTML = ''; 
    let predictions = JSON.parse(localStorage.getItem('weatherPredictions')) || [];
    if (predictions.length === 0) {
        predictionsListEl.innerHTML = '<p class="no-predictions-text">No predictions made yet. Make your first one!</p>';
        return;
    }

    predictions.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.submitted_on) - new Date(a.submitted_on);
    });

    const today = getFormattedDate(new Date());
    let needsStorageUpdate = false;

    predictions.forEach(prediction => {
        if (prediction.date < today && prediction.status === 'Pending') { 
            prediction.actual_max_temp = parseFloat((prediction.predicted_max_temp - (Math.random() * 4 - 2)).toFixed(1));
            const diff = Math.abs(prediction.actual_max_temp - prediction.predicted_max_temp);
            if (diff === 0) prediction.points = 10;
            else if (diff <= 0.5) prediction.points = 7;
            else if (diff <= 1.0) prediction.points = 5;
            else if (diff <= 1.5) prediction.points = 3;
            else if (diff <= 2.0) prediction.points = 1;
            else prediction.points = 0;
            prediction.status = 'Checked';
            needsStorageUpdate = true;
        }

        const item = document.createElement('div');
        item.classList.add('prediction-item', `prediction-status-${prediction.status.toLowerCase()}`);
        
        let actualTempDisplay = 'Pending';
        if (prediction.status === 'Checked') {
            actualTempDisplay = `${prediction.actual_max_temp !== null ? prediction.actual_max_temp + '&deg;C' : 'N/A'}`;
        } else if (prediction.date < today && prediction.status === 'Pending') {
            actualTempDisplay = 'Awaiting update...';
        }

        item.innerHTML = `
            <div class="prediction-meta">
                <span class="prediction-city">${prediction.city}</span> - 
                <span class="prediction-date">Forecast for: ${prediction.date}</span>
            </div>
            <div class="prediction-values">
                <span>Predicted: ${prediction.predicted_max_temp}&deg;C</span>
                <span>Actual: ${actualTempDisplay}</span>
            </div>
            <div class="prediction-result">
                <span class="prediction-status-text">Status: ${prediction.status}</span>
                <span class="prediction-points">Points: ${prediction.points}</span>
            </div>
            <small class="prediction-submitted-on">Submitted: ${new Date(prediction.submitted_on).toLocaleDateString()} ${new Date(prediction.submitted_on).toLocaleTimeString()}</small>
        `;
        predictionsListEl.appendChild(item);
    });

    if (needsStorageUpdate) {
        localStorage.setItem('weatherPredictions', JSON.stringify(predictions));
    }
}

// --- Weather History On This Day Logic ---
if (getHistoryBtnEl) {
    getHistoryBtnEl.addEventListener('click', function() {
        if (!currentLatitude || !currentLongitude) {
            displayAppFeedback(historyFeedbackMsgEl, "City location (latitude/longitude) not available. Please perform a current weather search first.", 'error');
            return;
        }

        const today = new Date();
        const currentDateStr = getFormattedDate(today);

        if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '';
        if (historyFeedbackMsgEl) { displayAppFeedback(historyFeedbackMsgEl, '', 'clear'); }

        if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '<p class="loading-text">Fetching historical weather...</p>';
        this.disabled = true;
        this.textContent = 'Fetching...';
        const button = this; // Store reference to button

        fetch(`/api/weather_history_on_this_day?latitude=${currentLatitude}&longitude=${currentLongitude}&current_date=${currentDateStr}`)
        .then(response => {
            if (!response.ok) { 
                return response.json().then(errData => {
                    throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
                }).catch(() => {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = ''; // Clear loading

            if (data.error) {
                displayAppFeedback(historyFeedbackMsgEl, data.error, 'error');
            } else if (data.history && data.history.length > 0) {
                let contentRendered = false;
                data.history.forEach(yearData => {
                    const item = document.createElement('div');
                    item.classList.add('historical-weather-item', 'card');

                    let detailsHTML = '';
                    if (yearData.error) {
                        detailsHTML = `<p class="error-message" style="display:block;">${yearData.error}</p>`;
                    } else {
                        detailsHTML = `
                            <p>Max Temp: ${yearData.max_temp !== null && yearData.max_temp !== "N/A" ? yearData.max_temp + '&deg;C' : 'N/A'}</p>
                            <p>Min Temp: ${yearData.min_temp !== null && yearData.min_temp !== "N/A" ? yearData.min_temp + '&deg;C' : 'N/A'}</p>
                            <p>Precipitation: ${yearData.precipitation !== null && yearData.precipitation !== "N/A" ? yearData.precipitation + ' mm' : 'N/A'}</p>
                        `;
                    }
                    
                    item.innerHTML = `
                        <div class="historical-item-title">
                            <h4>${yearData.year} <span class="historical-date">(${yearData.date})</span></h4>
                        </div>
                        ${detailsHTML}
                    `;
                    if (historicalDisplayAreaEl) historicalDisplayAreaEl.appendChild(item);
                    if (!yearData.error) contentRendered = true; 
                });
                if (!contentRendered && historicalDisplayAreaEl && !data.history.some(y => y.error)) { 
                     historicalDisplayAreaEl.innerHTML = '<p class="no-history-text">No historical data found for this date in the past 3 years.</p>';
                } else if (!contentRendered && historicalDisplayAreaEl && data.history.every(y => y.error)) { // Check if ALL years had errors
                    historicalDisplayAreaEl.innerHTML = '<p class="no-history-text">Could not retrieve historical data for any of the past 3 years.</p>';
                }

            } else {
                 if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '<p class="no-history-text">No historical data found for this date in the past 3 years.</p>';
            }
        })
        .catch(error => {
            if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = ''; // Clear loading
            displayAppFeedback(historyFeedbackMsgEl, `Network error fetching history: ${error.message}`, 'error');
            console.error("Fetch Weather History Error:", error);
        })
        .finally(() => {
            if (button) { // Use stored button reference
                 button.disabled = false;
                 button.textContent = 'Show Weather History';
            }
        });
    });
}


// --- Initialize page state --- (Must be AFTER all functions and main var declarations)
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Prediction Section State
    if (predictionCityNameEl) predictionCityNameEl.textContent = 'No city selected';
    if (maxTempPredictionInputEl) maxTempPredictionInputEl.disabled = true;
    if (submitPredictionBtnEl) submitPredictionBtnEl.disabled = true;

    // Initialize History Section State
    if (historyCityNameEl) historyCityNameEl.textContent = 'No city selected';
    if (getHistoryBtnEl) getHistoryBtnEl.disabled = true;

    displayStoredPredictions(); 
});


// --- Event listener for general weather search form submission ---
const searchForm = document.getElementById('search-form');
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        var cityInput = document.getElementById('city-input').value.trim();
        if (!cityInput) {
            displayError("Please enter a city name or use 'geolocation'.");
            return;
        }
        showLoadingState(); 
        if (cityInput.toLowerCase() === 'geolocation') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var latitude = position.coords.latitude;
                    var longitude = position.coords.longitude;
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(response => {
                        if (!response.ok) throw new Error(`Nominatim reverse geocoding failed: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        const foundCity = data.address?.city || data.address?.town || data.address?.village;
                        if (foundCity) {
                            document.getElementById('city-input').value = foundCity;
                            getWeather(foundCity);
                        } else {
                            displayError("Could not determine city from your location. Please enter manually.");
                        }
                    })
                    .catch(error => { displayError("Error getting city name from location. Please try entering manually."); console.error(error); });
                }, function(geoError) { displayError(`Geolocation error: ${geoError.message}. Please enter city manually.`); });
            } else { displayError("Geolocation is not supported by this browser. Please enter city manually."); }
        } else { getWeather(cityInput); }
    });
}

function getWeather(city) {
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => { throw new Error(errData.error || `Weather service error (Status: ${response.status})`); })
            .catch(() => { throw new Error(`Weather service error (Status: ${response.status})`); });
        }
        return response.json();
    })
    .then(weatherData => {
        if (weatherData.error) { displayError(weatherData.error); return; }
        
        updateWeatherDisplay(weatherData);

        // After main weather data is displayed, fetch and display AI summary
        const prompt = `Based on the following weather data for ${weatherData.city} today:
        - Current Temperature: ${weatherData.temperature}°C
        - Weather Condition: ${weatherData.description} (${weatherData.weather_main})
        - Humidity: ${weatherData.humidity}%
        - Wind Speed: ${weatherData.wind_speed} m/s
        - Pressure: ${weatherData.pressure} hPa
        Please provide a concise, conversational weather summary (2-3 sentences) suitable for a general user. Highlight any notable conditions or advice (e.g., if an umbrella is needed, if it's particularly windy, or if it's a pleasant day). Avoid conversational fluff like "Okay, here's the summary:". Focus on the most impactful aspects for someone planning their day.`;

        // Show loading state for AI summary
        const aiSummaryTextEl = document.getElementById('ai-summary-text');
        const aiSummaryCardEl = document.getElementById('ai-summary-card');
        if (aiSummaryTextEl) aiSummaryTextEl.textContent = 'Generating AI summary...'; // Placeholder
        if (aiSummaryCardEl) aiSummaryCardEl.style.display = 'block';

        getAiWeatherSummary(prompt)
            .then(aiSummary => {
                if (aiSummary && aiSummary.trim() !== "") {
                    displayAiSummary(aiSummary);
                } else {
                    console.warn("AI summary was empty or failed silently.");
                    hideAiSummary();
                }
            })
            .catch(error => {
                console.error("Error getting AI summary:", error);
                // Optionally display a user-friendly error message in the AI summary card itself
                if (aiSummaryTextEl) aiSummaryTextEl.textContent = 'Could not load AI summary at this time.';
                // Or simply hide it if preferred:
                // hideAiSummary();
            });

        if (weatherData.latitude && weatherData.longitude) {
             map.setView([weatherData.latitude, weatherData.longitude], 10);
             marker.setLatLng([weatherData.latitude, weatherData.longitude]);
             updatePopup(weatherData);
        } else {
            fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`)
            .then(response => { if (!response.ok) throw new Error(`Nominatim search failed: ${response.status}`); return response.json(); })
            .then(geoData => {
                if (geoData && geoData.length > 0) {
                    var lat = parseFloat(geoData[0].lat); var lon = parseFloat(geoData[0].lon);
                    map.setView([lat, lon], 10); marker.setLatLng([lat, lon]);
                    updatePopup(weatherData); 
                } else {
                    console.warn(`Could not find coordinates for city: ${city} via Nominatim.`);
                    updatePopup(weatherData); 
                }
            })
            .catch(error => { console.error('Nominatim API error:', error); updatePopup(weatherData); });
        }
    })
    .catch(error => { displayError(error.message); console.error('Get weather error:', error); });
}

// --- Activity Forecaster Logic ---
if (activityButton) {
    activityButton.addEventListener('click', function() {
        const selectedCheckboxes = document.querySelectorAll('#activity-selector input[name="activity"]:checked');
        const selectedActivities = Array.from(selectedCheckboxes).map(cb => cb.value);
        if (activityResultsDiv) activityResultsDiv.innerHTML = ''; 
        if (activityErrorDiv) { activityErrorDiv.textContent = ''; activityErrorDiv.style.display = 'none'; }

        if (!currentCityName) {
            if (activityErrorDiv) { activityErrorDiv.textContent = "Please search for a city's weather first."; activityErrorDiv.style.display = 'block'; }
            return;
        }
        if (selectedActivities.length === 0) {
            if (activityErrorDiv) { activityErrorDiv.textContent = "Please select at least one activity."; activityErrorDiv.style.display = 'block'; }
            return;
        }
        const selectedActivitiesString = selectedActivities.join(',');
        if (activityResultsDiv) activityResultsDiv.innerHTML = '<p class="loading-text">Fetching advice...</p>';
        const button = this;
        button.disabled = true;
        button.textContent = 'Fetching Advice...';
        
        fetch(`/api/perfect_day_forecast?city=${encodeURIComponent(currentCityName)}&activities=${selectedActivitiesString}`)
        .then(response => {
            if (!response.ok) { 
                return response.json().then(errData => { 
                    throw new Error(errData.error || `Activity forecast error (Status: ${response.status})`); 
                }).catch(() => { throw new Error(`Activity forecast error (Status: ${response.status})`); });
            }
            return response.json();
        })
        .then(data => {
            if (activityResultsDiv) activityResultsDiv.innerHTML = '';
            if (data.error) { 
                if (activityErrorDiv) { activityErrorDiv.textContent = data.error; activityErrorDiv.style.display = 'block'; }
                return; 
            }

            if (data.city && data.current_weather_summary && activityResultsDiv) {
                const summaryHeader = document.createElement('h3'); 
                summaryHeader.classList.add('forecast-summary-header'); 
                summaryHeader.textContent = `Activity Advice for ${data.city}`;
                activityResultsDiv.appendChild(summaryHeader);
                const weatherSummaryP = document.createElement('p'); 
                weatherSummaryP.classList.add('current-weather-summary-note'); 
                weatherSummaryP.textContent = `Based on current conditions: ${data.current_weather_summary}`;
                activityResultsDiv.appendChild(weatherSummaryP);
            }

            if (data.suggestions && Object.keys(data.suggestions).length > 0 && activityResultsDiv) {
                for (const [activityName, suggestionText] of Object.entries(data.suggestions)) {
                    const suggestionEl = document.createElement('div'); 
                    suggestionEl.classList.add('activity-suggestion');
                    if (suggestionText.toLowerCase().includes('favorable')) { suggestionEl.classList.add('favorable'); }
                    else if (suggestionText.toLowerCase().includes('unsuitable') || suggestionText.toLowerCase().includes('not ideal') || suggestionText.toLowerCase().includes('too cold') || suggestionText.toLowerCase().includes('too windy') || suggestionText.toLowerCase().includes('too high')) { suggestionEl.classList.add('unfavorable'); }
                    suggestionEl.innerHTML = `<h4>${activityName}</h4><p>${suggestionText}</p>`; 
                    activityResultsDiv.appendChild(suggestionEl);
                }
            } else if (!data.error && activityResultsDiv) { 
                const noAdviceP = document.createElement('p'); 
                noAdviceP.textContent = 'No specific advice for the selected activities based on current conditions, or activities were not recognized.'; 
                activityResultsDiv.appendChild(noAdviceP); 
            }
            if (data.note && activityResultsDiv) { 
                const noteEl = document.createElement('p'); 
                noteEl.classList.add('subtle-note', 'forecast-source-note'); 
                noteEl.textContent = data.note; 
                activityResultsDiv.appendChild(noteEl); 
            }
        })
        .catch(error => {
            if (activityResultsDiv) activityResultsDiv.innerHTML = '';
            if (activityErrorDiv) { 
                activityErrorDiv.textContent = error.message || "Failed to fetch activity forecast."; 
                activityErrorDiv.style.display = 'block'; 
            }
            console.error("Activity Forecast Fetch Error:", error);
        })
        .finally(() => {
            if(button) {
                button.disabled = false;
                button.textContent = 'Get Activity Advice';
            }
        });
    });
}

// --- Personalized Health & Wellness Weather --- 
if (healthAdviceButton && healthAdviceModal && modalCloseBtn && modalBody && modalDisclaimer && modalCitySummary) {
    healthAdviceButton.addEventListener('click', function() {
        const selectedCheckboxes = document.querySelectorAll('#health-concern-selector input[name="health_concern"]:checked');
        const selectedConcerns = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (healthErrorDiv) { healthErrorDiv.textContent = ''; healthErrorDiv.style.display = 'none'; }
        modalBody.innerHTML = ''; 
        modalDisclaimer.textContent = ''; 
        modalCitySummary.textContent = '';

        if (!currentCityName) {
            if (healthErrorDiv) { healthErrorDiv.textContent = "Please search for a city's weather first."; healthErrorDiv.style.display = 'block'; }
            return;
        }
        if (selectedConcerns.length === 0) {
            if (healthErrorDiv) { healthErrorDiv.textContent = "Please select at least one health concern."; healthErrorDiv.style.display = 'block'; }
            return;
        }
        const selectedConcernsString = selectedConcerns.join(',');
        const originalButtonText = healthAdviceButton.textContent;
        healthAdviceButton.textContent = 'Fetching Advice...'; 
        healthAdviceButton.disabled = true;

        fetch(`/api/health_weather_advice?city=${encodeURIComponent(currentCityName)}&concerns=${selectedConcernsString}`)
        .then(response => {
            if (!response.ok) { 
                return response.json().then(errData => { 
                    throw new Error(errData.error || `Health advice error (Status: ${response.status})`); 
                }).catch(() => { throw new Error(`Health advice error (Status: ${response.status})`); });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) { 
                if (healthErrorDiv) { healthErrorDiv.textContent = data.error; healthErrorDiv.style.display = 'block'; }
                return; 
            }

            if (data.city) { modalCitySummary.textContent = `Health advice for ${data.city}, based on current conditions.`; }
            else { modalCitySummary.textContent = `Health advice for ${currentCityName}, based on current conditions.`; }

            if (data.triggered_advice && data.triggered_advice.length > 0) {
                data.triggered_advice.forEach(advice => { const p = document.createElement('p'); p.textContent = advice; modalBody.appendChild(p); });
            } else {
                const p = document.createElement('p'); 
                p.textContent = "Current weather conditions do not indicate specific additional risks for your selected concerns at this time."; 
                modalBody.appendChild(p);
            }
            if (data.disclaimer) { modalDisclaimer.textContent = data.disclaimer; }
            healthAdviceModal.classList.add('show');
        })
        .catch(error => {
            if (healthErrorDiv) { 
                healthErrorDiv.textContent = error.message || "Failed to fetch health advice."; 
                healthErrorDiv.style.display = 'block'; 
            }
            console.error("Health Advice Fetch Error:", error);
        })
        .finally(() => {
            healthAdviceButton.textContent = originalButtonText;
            healthAdviceButton.disabled = false;
        });
    });

    modalCloseBtn.addEventListener('click', function() {
        healthAdviceModal.classList.remove('show');
    });

    window.addEventListener('click', function(event) {
        if (event.target == healthAdviceModal) {
            healthAdviceModal.classList.remove('show');
        }
    });
}

// Prediction Challenge Submit Button
if (submitPredictionBtnEl) {
    submitPredictionBtnEl.addEventListener('click', function() {
        if (!currentCityName || currentCityName === 'No city selected') { 
            displayAppFeedback(predictionFeedbackMsgEl, 'Please search for a city first to make a prediction.', 'error'); 
            return; 
        }
        const rawValue = maxTempPredictionInputEl.value.trim();
        if (rawValue === '') { 
            displayAppFeedback(predictionFeedbackMsgEl, 'Prediction cannot be empty.', 'error'); 
            return; 
        }
        const predictedTemp = parseFloat(rawValue);
        if (isNaN(predictedTemp)) { 
            displayAppFeedback(predictionFeedbackMsgEl, 'Invalid number format for temperature.', 'error'); 
            return; 
        }
        if (predictedTemp < -50 || predictedTemp > 60) { 
            displayAppFeedback(predictionFeedbackMsgEl, 'Temperature must be between -50 and 60°C.', 'error'); 
            return; 
        }
        const tomorrowsDate = getTomorrowsDateString();
        let predictions = JSON.parse(localStorage.getItem('weatherPredictions')) || [];
        const existingPrediction = predictions.find(p => p.city === currentCityName && p.date === tomorrowsDate);
        if (existingPrediction) { 
            displayAppFeedback(predictionFeedbackMsgEl, `Prediction already made for ${currentCityName} for tomorrow (${tomorrowsDate}).`, 'error'); 
            return; 
        }
        const newPrediction = {
            id: Date.now().toString(), city: currentCityName, date: tomorrowsDate,
            predicted_max_temp: predictedTemp, actual_max_temp: null,
            submitted_on: new Date().toISOString(), status: 'Pending', points: 0
        };
        predictions.push(newPrediction);
        localStorage.setItem('weatherPredictions', JSON.stringify(predictions));
        displayAppFeedback(predictionFeedbackMsgEl, `Prediction for ${currentCityName} (${predictedTemp}°C for ${tomorrowsDate}) submitted!`, 'success');
        if (maxTempPredictionInputEl) maxTempPredictionInputEl.value = '';
        displayStoredPredictions();
    });
}
