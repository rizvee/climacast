// app.js

var map = L.map('map').setView([0, 0], 2); // Default view set to center of the map with zoom level 2

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize marker without popup content
var marker = L.marker([0, 0]).addTo(map);

// Function to update marker's popup content
function updatePopup(city, temperature, description, humidity, pressure, wind_speed) {
    marker.setPopupContent(`
        <h3>${city}</h3>
        <p>Temperature: ${temperature}°C</p>
        <p>Description: ${description}</p>
        <p>Humidity: ${humidity}%</p>
        <p>Pressure: ${pressure} hPa</p>
        <p>Wind Speed: ${wind_speed} m/s</p>
    `);
}

// Event listener for form submission
document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    var cityInput = document.getElementById('city-input').value;

    // Perform geolocation
    if (cityInput === 'geolocation') {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;

                // Reverse geocoding to get city name
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                .then(response => response.json())
                .then(data => {
                    cityInput = data.address.city;
                    getWeather(cityInput);
                })
                .catch(error => console.error('Error:', error));
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    } else {
        getWeather(cityInput);
    }
});

// Function to fetch weather data and update popup
function getWeather(city) {
    fetch(`/weather?city=${city}`)
    .then(response => response.json())
    .then(data => {
        updatePopup(city, data.temperature, data.description, data.humidity, data.pressure, data.wind_speed);
        // Fetch latitude and longitude of the city to set map view
        fetch(`https://nominatim.openstreetmap.org/search?city=${city}&format=json`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                var lat = data[0].lat;
                var lon = data[0].lon;
                map.setView([lat, lon], 10); // Set the map view to the coordinates of the city with zoom level 10
                marker.setLatLng([lat, lon]); // Set marker's position to the coordinates of the city
            }
        })
        .catch(error => console.error('Error:', error));
    })
    .catch(error => console.error('Error:', error));
}
