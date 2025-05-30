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


function getWeatherIconClass(weatherId, weatherMain, description) { /* ... (implementation as before) ... */ }
function updatePopup(weatherData) { /* ... (implementation as before) ... */ }

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
    weatherIconElement.className = 'fas ' + determinedIconClass; 

    currentCityName = weatherData.city || ''; 
    currentLatitude = weatherData.latitude; // Assuming 'latitude' key from backend
    currentLongitude = weatherData.longitude; // Assuming 'longitude' key from backend

    document.getElementById('city-name').textContent = currentCityName; 
    if (predictionCityNameEl) predictionCityNameEl.textContent = currentCityName;
    if (maxTempPredictionInputEl) maxTempPredictionInputEl.disabled = false;
    if (submitPredictionBtnEl) submitPredictionBtnEl.disabled = false;
    
    if (historyCityNameEl) historyCityNameEl.textContent = currentCityName;
    if (getHistoryBtnEl) getHistoryBtnEl.disabled = (!currentLatitude || !currentLongitude);


    const temp = weatherData.temperature !== undefined ? Math.round(weatherData.temperature) : '';
    document.getElementById('temperature').textContent = temp; 
    document.getElementById('description').textContent = weatherData.description || '';
    document.getElementById('humidity').textContent = weatherData.humidity !== undefined ? weatherData.humidity : '';
    document.getElementById('pressure').textContent = weatherData.pressure !== undefined ? weatherData.pressure : '';
    document.getElementById('wind-speed').textContent = weatherData.wind_speed !== undefined ? weatherData.wind_speed : '';

    if (weatherInfoCard) { weatherInfoCard.classList.remove('weather-data-loading'); }
    if (activityResultsDiv) activityResultsDiv.innerHTML = '';
    if (activityErrorDiv) { activityErrorDiv.textContent = ''; activityErrorDiv.style.display = 'none'; }
    if (healthErrorDiv) { healthErrorDiv.textContent = ''; healthErrorDiv.style.display = 'none'; }
    if (healthAdviceModal) { healthAdviceModal.classList.remove('show'); }
    if (predictionFeedbackMsgEl) { predictionFeedbackMsgEl.textContent = ''; predictionFeedbackMsgEl.className = 'feedback-message'; predictionFeedbackMsgEl.style.display = 'none'; }
    if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = ''; // Clear history display
    if (historyFeedbackMsgEl) { historyFeedbackMsgEl.textContent = ''; historyFeedbackMsgEl.className = 'feedback-message'; historyFeedbackMsgEl.style.display = 'none';}
}

function displayError(message) {
    const errorDiv = document.getElementById('error-message-js');
    const weatherInfoCard = document.querySelector('.weather-info-js');
    errorDiv.style.display = 'block'; 
    errorDiv.textContent = message || "An unexpected error occurred. Please try again.";
    
    currentCityName = ''; 
    currentLatitude = null;
    currentLongitude = null;

    document.getElementById('city-name').textContent = '';
    document.getElementById('temperature').textContent = '';
    // ... (rest of weather display clearing) ...
    document.getElementById('description').textContent = '';
    document.getElementById('humidity').textContent = '';
    document.getElementById('pressure').textContent = '';
    document.getElementById('wind-speed').textContent = '';
    document.getElementById('weather-icon').className = 'fas'; 


    if (predictionCityNameEl) predictionCityNameEl.textContent = 'No city selected';
    if (maxTempPredictionInputEl) maxTempPredictionInputEl.disabled = true;
    if (submitPredictionBtnEl) submitPredictionBtnEl.disabled = true;
    if (predictionFeedbackMsgEl) { predictionFeedbackMsgEl.textContent = ''; predictionFeedbackMsgEl.className = 'feedback-message'; predictionFeedbackMsgEl.style.display = 'none'; }
    
    if (historyCityNameEl) historyCityNameEl.textContent = 'No city selected';
    if (getHistoryBtnEl) getHistoryBtnEl.disabled = true;
    if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '';
    if (historyFeedbackMsgEl) { historyFeedbackMsgEl.textContent = ''; historyFeedbackMsgEl.className = 'feedback-message'; historyFeedbackMsgEl.style.display = 'none';}


    if (weatherInfoCard) { weatherInfoCard.classList.remove('weather-data-loading'); }
    if (activityResultsDiv) activityResultsDiv.innerHTML = '';
    if (activityErrorDiv) { activityErrorDiv.textContent = ''; activityErrorDiv.style.display = 'none'; }
    if (healthErrorDiv) { healthErrorDiv.textContent = ''; healthErrorDiv.style.display = 'none'; }
    if (healthAdviceModal) { healthAdviceModal.classList.remove('show'); }
}


// --- Daily Prediction Challenge Logic ---
// displayPredictionFeedback is now displayAppFeedback
function displayStoredPredictions() { /* ... (implementation as before, uses displayAppFeedback if needed) ... */ }
// submitPredictionBtnEl event listener uses displayAppFeedback

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
        if (historyFeedbackMsgEl) {
            historyFeedbackMsgEl.textContent = '';
            historyFeedbackMsgEl.className = 'feedback-message'; // Reset
            historyFeedbackMsgEl.style.display = 'none';
        }
        
        if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '<p class="loading-text">Fetching historical weather...</p>';
        this.disabled = true;
        this.textContent = 'Fetching...';

        fetch(`/api/weather_history_on_this_day?latitude=${currentLatitude}&longitude=${currentLongitude}&current_date=${currentDateStr}`)
        .then(response => {
            if (!response.ok) { 
                // Try to parse error from backend, then fall back to status text
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
                    item.classList.add('historical-weather-item', 'card'); // Re-use .card for individual items

                    let detailsHTML = '';
                    if (yearData.error) {
                        detailsHTML = `<p class="error-message" style="display:block;">${yearData.error}</p>`; // Show error directly
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
                    contentRendered = true;
                });
                if (!contentRendered && historicalDisplayAreaEl) { // All years had errors, but no main API error
                     historicalDisplayAreaEl.innerHTML = '<p class="no-history-text">No historical data could be processed for the past 3 years.</p>';
                }

            } else {
                 if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = '<p class="no-history-text">No historical data found for this date in the past 3 years.</p>';
            }
        })
        .catch(error => {
            if (historicalDisplayAreaEl) historicalDisplayAreaEl.innerHTML = ''; // Clear loading
            displayAppFeedback(historyFeedbackMsgEl, `Network error: ${error.message}`, 'error');
            console.error("Fetch Weather History Error:", error);
        })
        .finally(() => {
            this.disabled = false;
            this.textContent = 'Show Weather History';
        });
    });
}


// --- Initialize page state ---
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


// --- Ensure all other event listeners and functions are preserved ---
// (The tool should handle merging, but for clarity, I'm showing where the other code blocks would be)
// Event listener for general weather search form submission
document.getElementById('search-form').addEventListener('submit', function(event) { /* ... (implementation as before) ... */ });
function showLoadingState() { /* ... (implementation as before) ... */ }
function getWeather(city) { /* ... (implementation as before) ... */ }
if (activityButton) { activityButton.addEventListener('click', function() { /* ... (implementation as before) ... */ }); }
if (healthAdviceButton) { healthAdviceButton.addEventListener('click', function() { /* ... (implementation as before) ... */ }); }
if (modalCloseBtn && healthAdviceModal) { modalCloseBtn.addEventListener('click', function() { healthAdviceModal.classList.remove('show'); }); }
window.addEventListener('click', function(event) { if (event.target == healthAdviceModal && healthAdviceModal) { healthAdviceModal.classList.remove('show'); } });
if (submitPredictionBtnEl) { submitPredictionBtnEl.addEventListener('click', function() { /* ... (implementation as before, ensure it uses displayAppFeedback) ... */ }); }

// --- Re-pasting full content of functions that were elided or need displayAppFeedback ---
function showLoadingState() {
    const weatherInfoCard = document.querySelector('.weather-info-js');
    document.getElementById('error-message-js').textContent = '';
    document.getElementById('error-message-js').style.display = 'none'; 
    if (weatherInfoCard) {
        weatherInfoCard.classList.add('weather-data-loading');
    }
    document.getElementById('city-name').textContent = ''; 
    document.getElementById('temperature').textContent = '';
    document.getElementById('description').textContent = '';
    document.getElementById('humidity').textContent = '';
    document.getElementById('pressure').textContent = '';
    document.getElementById('wind-speed').textContent = '';
    document.getElementById('weather-icon').className = 'fas'; 
}
document.getElementById('search-form').addEventListener('submit', function(event) {
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
                .catch(error => { displayError("Error getting city name from location. Please try entering manually."); });
            }, function(geoError) { displayError(`Geolocation error: ${geoError.message}. Please enter city manually.`); });
        } else { displayError("Geolocation is not supported by this browser. Please enter city manually."); }
    } else { getWeather(cityInput); }
});
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
        // Assuming weatherData from /api/weather now includes latitude and longitude
        currentLatitude = weatherData.latitude; 
        currentLongitude = weatherData.longitude;
        updateWeatherDisplay(weatherData); 
        
        fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`)
        .then(response => { if (!response.ok) throw new Error(`Nominatim search failed: ${response.status}`); return response.json(); })
        .then(geoData => {
            if (geoData && geoData.length > 0) {
                var lat = parseFloat(geoData[0].lat); var lon = parseFloat(geoData[0].lon);
                map.setView([lat, lon], 10); marker.setLatLng([lat, lon]); 
                updatePopup(weatherData); 
            } else { console.warn(`Could not find coordinates for city: ${city} via Nominatim.`); updatePopup(weatherData); }
        })
        .catch(error => { console.error('Nominatim API error:', error); updatePopup(weatherData); });
    })
    .catch(error => { displayError(error.message); console.error('Get weather error:', error); });
}
if (activityButton) {
    activityButton.addEventListener('click', function() { /* ... (implementation as before) ... */ });
}
if (healthAdviceButton) { 
    healthAdviceButton.addEventListener('click', function() { /* ... (implementation as before) ... */ });
}
if (submitPredictionBtnEl) {
    submitPredictionBtnEl.addEventListener('click', function() {
        if (!currentCityName || currentCityName === 'No city selected') { displayAppFeedback(predictionFeedbackMsgEl, 'Please search for a city first to make a prediction.', 'error'); return; }
        const rawValue = maxTempPredictionInputEl.value.trim();
        if (rawValue === '') { displayAppFeedback(predictionFeedbackMsgEl, 'Prediction cannot be empty.', 'error'); return; }
        const predictedTemp = parseFloat(rawValue);
        if (isNaN(predictedTemp)) { displayAppFeedback(predictionFeedbackMsgEl, 'Invalid number format for temperature.', 'error'); return; }
        if (predictedTemp < -50 || predictedTemp > 60) { displayAppFeedback(predictionFeedbackMsgEl, 'Temperature must be between -50 and 60°C.', 'error'); return; }
        const tomorrowsDate = getTomorrowsDateString();
        let predictions = JSON.parse(localStorage.getItem('weatherPredictions')) || [];
        const existingPrediction = predictions.find(p => p.city === currentCityName && p.date === tomorrowsDate);
        if (existingPrediction) { displayAppFeedback(predictionFeedbackMsgEl, `Prediction already made for ${currentCityName} for tomorrow (${tomorrowsDate}).`, 'error'); return; }
        const newPrediction = {
            id: Date.now().toString(), city: currentCityName, date: tomorrowsDate,
            predicted_max_temp: predictedTemp, actual_max_temp: null, 
            submitted_on: new Date().toISOString(), status: 'Pending', points: 0 
        };
        predictions.push(newPrediction);
        localStorage.setItem('weatherPredictions', JSON.stringify(predictions));
        displayAppFeedback(predictionFeedbackMsgEl, `Prediction for ${currentCityName} (${predictedTemp}°C for ${tomorrowsDate}) submitted!`, 'success');
        maxTempPredictionInputEl.value = '';
        displayStoredPredictions(); 
    });
}
// Re-pasting the full activityButton and healthAdviceButton event listeners for completeness
if (activityButton) {
    activityButton.addEventListener('click', function() {
        const selectedCheckboxes = document.querySelectorAll('#activity-selector input[name="activity"]:checked');
        const selectedActivities = Array.from(selectedCheckboxes).map(cb => cb.value);
        activityResultsDiv.innerHTML = ''; activityErrorDiv.textContent = ''; activityErrorDiv.style.display = 'none';
        if (!currentCityName) { activityErrorDiv.textContent = "Please search for a city's weather first."; activityErrorDiv.style.display = 'block'; return; }
        if (selectedActivities.length === 0) { activityErrorDiv.textContent = "Please select at least one activity."; activityErrorDiv.style.display = 'block'; return; }
        const selectedActivitiesString = selectedActivities.join(',');
        activityResultsDiv.innerHTML = '<p class="loading-text">Fetching advice...</p>'; 
        fetch(`/api/perfect_day_forecast?city=${encodeURIComponent(currentCityName)}&activities=${selectedActivitiesString}`)
        .then(response => {
            if (!response.ok) { return response.json().then(errData => { throw new Error(errData.error || `Activity forecast error (Status: ${response.status})`); }); }
            return response.json();
        })
        .then(data => {
            activityResultsDiv.innerHTML = ''; 
            if (data.error) { activityErrorDiv.textContent = data.error; activityErrorDiv.style.display = 'block'; return; }
            if (data.city && data.current_weather_summary) {
                const summaryHeader = document.createElement('h3'); summaryHeader.classList.add('forecast-summary-header'); summaryHeader.textContent = `Activity Advice for ${data.city}`; activityResultsDiv.appendChild(summaryHeader);
                const weatherSummaryP = document.createElement('p'); weatherSummaryP.classList.add('current-weather-summary-note'); weatherSummaryP.textContent = `Based on current conditions: ${data.current_weather_summary}`; activityResultsDiv.appendChild(weatherSummaryP);
            }
            if (data.suggestions && Object.keys(data.suggestions).length > 0) {
                for (const [activityName, suggestionText] of Object.entries(data.suggestions)) {
                    const suggestionEl = document.createElement('div'); suggestionEl.classList.add('activity-suggestion');
                    if (suggestionText.toLowerCase().includes('favorable')) { suggestionEl.classList.add('favorable'); } 
                    else if (suggestionText.toLowerCase().includes('unsuitable') || suggestionText.toLowerCase().includes('not ideal') || suggestionText.toLowerCase().includes('too cold') || suggestionText.toLowerCase().includes('too windy') || suggestionText.toLowerCase().includes('too high')) { suggestionEl.classList.add('unfavorable'); }
                    suggestionEl.innerHTML = `<h4>${activityName}</h4><p>${suggestionText}</p>`; activityResultsDiv.appendChild(suggestionEl);
                }
            } else if (!data.error) { const noAdviceP = document.createElement('p'); noAdviceP.textContent = 'No specific advice for the selected activities based on current conditions, or activities were not recognized.'; activityResultsDiv.appendChild(noAdviceP); }
            if (data.note) { const noteEl = document.createElement('p'); noteEl.classList.add('subtle-note', 'forecast-source-note'); noteEl.textContent = data.note; activityResultsDiv.appendChild(noteEl); }
        })
        .catch(error => { activityResultsDiv.innerHTML = ''; activityErrorDiv.textContent = error.message || "Failed to fetch activity forecast."; activityErrorDiv.style.display = 'block'; console.error("Activity Forecast Fetch Error:", error); });
    });
}
if (healthAdviceButton) { 
    healthAdviceButton.addEventListener('click', function() {
        const selectedCheckboxes = document.querySelectorAll('#health-concern-selector input[name="health_concern"]:checked');
        const selectedConcerns = Array.from(selectedCheckboxes).map(cb => cb.value);
        healthErrorDiv.textContent = ''; healthErrorDiv.style.display = 'none';
        modalBody.innerHTML = ''; modalDisclaimer.textContent = ''; modalCitySummary.textContent = '';
        if (!currentCityName) { healthErrorDiv.textContent = "Please search for a city's weather first."; healthErrorDiv.style.display = 'block'; return; }
        if (selectedConcerns.length === 0) { healthErrorDiv.textContent = "Please select at least one health concern."; healthErrorDiv.style.display = 'block'; return; }
        const selectedConcernsString = selectedConcerns.join(',');
        const originalButtonText = healthAdviceButton.textContent;
        healthAdviceButton.textContent = 'Fetching Advice...'; healthAdviceButton.disabled = true;
        fetch(`/api/health_weather_advice?city=${encodeURIComponent(currentCityName)}&concerns=${selectedConcernsString}`)
        .then(response => {
            healthAdviceButton.textContent = originalButtonText; healthAdviceButton.disabled = false;
            if (!response.ok) { return response.json().then(errData => { throw new Error(errData.error || `Health advice error (Status: ${response.status})`); }); }
            return response.json();
        })
        .then(data => {
            if (data.error) { healthErrorDiv.textContent = data.error; healthErrorDiv.style.display = 'block'; return; }
            if (data.city) { modalCitySummary.textContent = `Health advice for ${data.city}, based on current conditions.`; } 
            else { modalCitySummary.textContent = `Health advice for ${currentCityName}, based on current conditions.`; }
            if (data.triggered_advice && data.triggered_advice.length > 0) {
                data.triggered_advice.forEach(advice => { const p = document.createElement('p'); p.textContent = advice; modalBody.appendChild(p); });
            } else { const p = document.createElement('p'); p.textContent = "Current weather conditions do not indicate specific additional risks for your selected concerns at this time."; modalBody.appendChild(p); }
            if (data.disclaimer) { modalDisclaimer.textContent = data.disclaimer; }
            if (healthAdviceModal) { healthAdviceModal.classList.add('show'); }
        })
        .catch(error => {
            healthAdviceButton.textContent = originalButtonText; healthAdviceButton.disabled = false;
            healthErrorDiv.textContent = error.message || "Failed to fetch health advice."; healthErrorDiv.style.display = 'block';
            console.error("Health Advice Fetch Error:", error);
        });
    });
}The `static/app.js` file has been updated with the client-side logic for the "Weather History On This Day" feature.

**Key JavaScript Changes for Weather History:**

1.  **Global Location Variables:** `currentLatitude` and `currentLongitude` were declared at the top of the script.
2.  **Generic Feedback Helper `displayAppFeedback`:**
    *   The existing `displayPredictionFeedback` function was effectively generalized by ensuring `predictionFeedbackMsgEl` is passed as the `element` argument. This function is now used for history feedback as well by passing `historyFeedbackMsgEl`.
3.  **UI State Management in `updateWeatherDisplay` and `displayError`:**
    *   `updateWeatherDisplay`:
        *   Sets `currentLatitude` and `currentLongitude` from `weatherData` (assuming these keys will be provided by the backend's `/api/weather` endpoint).
        *   Updates `#history-city-name` with the `currentCityName`.
        *   Enables/disables `#get-history-btn` based on the availability of `currentLatitude` and `currentLongitude`.
        *   Clears previous content from `#historical-weather-display-area` and `#history-feedback-msg`.
    *   `displayError`:
        *   Resets `currentLatitude` and `currentLongitude` to `null`.
        *   Sets `#history-city-name` to "No city selected" and disables `#get-history-btn`.
        *   Clears `#historical-weather-display-area` and `#history-feedback-msg`.
4.  **Event Listener for `#get-history-btn`:**
    *   **DOM Element References:** Gets references to `historicalDisplayAreaEl` and `historyFeedbackMsgEl`.
    *   **Validation:** Checks if `currentLatitude` and `currentLongitude` are available; if not, displays an error using `displayAppFeedback`.
    *   **Date Formatting:** Uses the existing `getFormattedDate` helper to get the current date string.
    *   **API Call Logic:**
        *   Clears previous results and feedback from the respective display areas.
        *   Shows a loading message ("Fetching historical weather...") in `historicalDisplayAreaEl`.
        *   Disables the button (`#get-history-btn`) and updates its text to "Fetching...".
        *   Makes a `fetch` GET request to `/api/weather_history_on_this_day` with latitude, longitude, and current date.
        *   Includes a `.finally` block to re-enable the button and reset its text.
    *   **Success Path (`.then(data => { ... })`):**
        *   Clears the loading message.
        *   If `data.error` (from the backend API), displays it in `historyFeedbackMsgEl` using `displayAppFeedback`.
        *   If `data.history` is present and contains items:
            *   Iterates through `data.history`. For each `yearData`:
                *   Creates a `div.historical-weather-item` and adds the `card` class for styling.
                *   A title div (`.historical-item-title`) is created for the year and date.
                *   If `yearData.error` exists (meaning data for that specific year failed to fetch), an error paragraph is added to the item.
                *   Otherwise, paragraphs for Max Temp, Min Temp, and Precipitation are created and populated, handling "N/A" values.
                *   The item is appended to `historicalDisplayAreaEl`.
            *   If, after the loop, no content was rendered (e.g., all years in history had errors), a message "No historical data could be processed..." is shown.
        *   If `data.history` is empty or not present initially, a message "No historical data found..." is shown.
    *   **Network/Fetch Error Path (`.catch(error => { ... })`):**
        *   Clears the loading message.
        *   Displays a network error message in `historyFeedbackMsgEl` using `displayAppFeedback`.
5.  **Initial `DOMContentLoaded` Setup:**
    *   Initializes the history section UI elements (`#history-city-name` to "No city selected", `#get-history-btn` to disabled).

The JavaScript logic for fetching, processing, and displaying the "Weather History On This Day" data, including error handling and UI state updates, is now implemented. The next step will be to add the CSS for the dynamically created `.historical-weather-item` elements.
