from flask import Flask, render_template, request, jsonify
import requests
import os
from datetime import datetime, timedelta 

app = Flask(__name__)

# Base URL for OpenWeatherMap API (Current Weather)
OWM_BASE_URL = 'http://api.openweathermap.org/data/2.5/weather'
# Base URL for Open-Meteo Historical API
OPEN_METEO_HISTORICAL_URL = 'https://archive-api.open-meteo.com/v1/archive'


# --- Perfect Day Forecaster Data ---
PERFECT_DAY_ACTIVITIES = {
    "running": { "display_name": "Running", "temp_range_c": (5, 22), "max_wind_kmh": 25, "max_humidity_percent": 80, "avoid_conditions": ["Rain", "Snow", "Thunderstorm", "Fog", "Mist"] },
    "cycling": { "display_name": "Cycling", "temp_range_c": (10, 28), "max_wind_kmh": 30, "max_humidity_percent": 75, "avoid_conditions": ["Rain", "Snow", "Thunderstorm", "Fog", "Mist"] },
    "picnic": { "display_name": "Picnic", "temp_range_c": (18, 30), "max_wind_kmh": 15, "min_temp_c": 15, "avoid_conditions": ["Rain", "Snow", "Thunderstorm", "Strong Wind"] },
    "gardening": { "display_name": "Gardening", "temp_range_c": (12, 28), "max_wind_kmh": 20, "avoid_conditions": ["Rain", "Snow", "Thunderstorm", "Extreme Heat"] },
    "stargazing": { "display_name": "Stargazing", "require_conditions": ["Clear"], "avoid_conditions": ["Clouds", "Rain", "Snow", "Fog", "Mist"] },
    "beach_day": { "display_name": "Beach Day", "temp_range_c": (22, 35), "min_temp_c": 20, "max_wind_kmh": 20, "require_conditions": ["Clear", "Clouds"], "avoid_conditions": ["Rain", "Thunderstorm", "Snow"] },
    "hiking": { "display_name": "Hiking", "temp_range_c": (8, 25), "max_wind_kmh": 25, "max_humidity_percent": 85, "avoid_conditions": ["Rain", "Snow", "Thunderstorm", "Extreme Heat", "Fog"] }
}
# --- End Perfect Day Forecaster Data ---

# --- Health & Wellness Weather Data (Focus on Bangladesh) ---
HEALTH_CONCERNS_BN = {
    "flu_respiratory": {"display_name": "Flu & Respiratory Issues", "triggers": {"low_temp_c": 18, "high_humidity_thresh_percent": 80}, "advice": "Low temperatures and high humidity can aggravate flu and respiratory issues. Stay warm, hydrate, and avoid crowded places if feeling unwell."},
    "heatstroke_exhaustion": {"display_name": "Heatstroke & Exhaustion", "triggers": {"high_feels_like_c": 38, "high_temp_c_extreme": 42, "high_humidity_with_high_temp_percent": 60, "temp_thresh_for_humidity_check_c": 30}, "advice": "High temperatures and humidity increase heatstroke risk. Stay hydrated, avoid strenuous activity during peak sun hours, and seek shade."},
    "dengue_risk": {"display_name": "Dengue Fever Risk", "triggers": {"recent_heavy_rain": True, "moderate_temp_c": (20, 30), "high_humidity_thresh_percent": 70}, "advice": "Mosquito activity, which can transmit dengue, may increase after rainfall, especially in warm and humid conditions. Use repellent, wear protective clothing, and eliminate stagnant water sources."},
    "skin_rashes_allergies": {"display_name": "Skin Rashes & Allergies", "triggers": {"high_humidity_thresh_percent": 75, "high_temp_c": 30}, "advice": "High heat and humidity can worsen skin rashes and allergies. Keep skin dry, wear loose cotton clothing, and stay hydrated."},
    "joint_pain_arthritis": {"display_name": "Joint Pain & Arthritis", "triggers": {"low_temp_c": 15, "high_humidity_thresh_percent": 80}, "advice": "Cold, damp weather can sometimes aggravate joint pain for individuals with arthritis. Keep warm and consider gentle exercises."}
}
# --- End Health & Wellness Data ---


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/weather', methods=['GET'])
def get_weather():
    api_key = os.getenv('OPENWEATHERMAP_API_KEY')
    if not api_key:
        app.logger.error("OPENWEATHERMAP_API_KEY not set.")
        return jsonify({'error': 'API key not configured. Please contact administrator.'}), 500
    city = request.args.get('city')
    if not city:
        return jsonify({'error': 'City parameter is required.'}), 400
    params = {'q': city, 'appid': api_key, 'units': 'metric'}
    try:
        response = requests.get(OWM_BASE_URL, params=params) 
        response.raise_for_status()
        data = response.json()

        # Check for essential keys more thoroughly
        if not all(k in data for k in ['weather', 'main', 'wind', 'coord']):
            app.logger.error(f"Malformed weather data for city '{city}': Core keys missing. Data: {data}")
            return jsonify({'error': 'Received incomplete data from weather service.'}), 500
        if not data['weather']: # Ensure weather list is not empty
             app.logger.error(f"Malformed weather data for city '{city}': 'weather' array empty. Data: {data}")
             return jsonify({'error': 'Received incomplete weather details from weather service.'}), 500


        if 'cod' in data and str(data['cod']) != '200':
            error_message = data.get('message', 'An error occurred with the weather service.')
            status_code = int(data['cod'])
            if status_code == 401: error_message = 'Unauthorized. Check your API key.'
            elif status_code == 404: error_message = f"City '{city}' not found. Please check the spelling."
            elif status_code == 429: error_message = 'Rate limit exceeded. Please try again later.'
            app.logger.warning(f"OpenWeatherMap API error for city '{city}': {data.get('message')} (status: {status_code})")
            return jsonify({'error': error_message}), status_code
        
        weather_info = {
            'city': data.get('name', city), 
            'temperature': data['main']['temp'],
            'description': data['weather'][0]['description'],
            'weather_main': data['weather'][0]['main'],
            'weather_id': data['weather'][0]['id'],
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'wind_speed': data['wind']['speed'],
            'latitude': data['coord']['lat'],   # Added latitude
            'longitude': data['coord']['lon']  # Added longitude
        }
        return jsonify(weather_info), 200
    except requests.exceptions.HTTPError as http_err:
        status_code = http_err.response.status_code if http_err.response is not None else 500
        error_message = 'An error occurred while fetching weather data.'
        if status_code == 401: error_message = 'Unauthorized. Invalid API key.'
        elif status_code == 404: error_message = f"Weather data for city '{city}' not found or API endpoint error."
        elif status_code == 429: error_message = 'Rate limit exceeded with weather service. Please try again later.'
        app.logger.error(f"HTTPError when calling OpenWeatherMap for city '{city}': {http_err}")
        return jsonify({'error': error_message}), status_code
    except requests.exceptions.Timeout:
        app.logger.error(f"Timeout when calling OpenWeatherMap for city '{city}'.") # Added logging for timeout
        return jsonify({'error': 'The request to the weather service timed out. Please try again later.'}), 504 
    except requests.exceptions.RequestException as e: # Added logging for general request exception
        app.logger.error(f"RequestException when calling OpenWeatherMap for city '{city}': {e}")
        return jsonify({'error': 'Could not connect to the weather service. Please check your network or try again later.'}), 503 
    except Exception as e:
        app.logger.error(f"An unexpected error occurred in /api/weather for city '{city}': {e}", exc_info=True)
        return jsonify({'error': 'An unexpected server error occurred. Please try again later.'}), 500

# --- Helper for Perfect Day Forecaster ---
def analyze_activity_conditions(activity_key, activity_prefs, current_weather):
    # ... (implementation as before) ...
    temp_c = current_weather['temperature']
    wind_kmh = current_weather['wind_speed_kmh']
    humidity = current_weather['humidity']
    weather_main = current_weather['weather_main']
    activity_name = activity_prefs.get("display_name", activity_key.capitalize())
    if "avoid_conditions" in activity_prefs:
        for condition in activity_prefs["avoid_conditions"]:
            if condition.lower() == weather_main.lower(): return f"{activity_name}: Unsuitable due to current {weather_main.lower()} conditions."
            if condition == "Extreme Heat" and temp_c > activity_prefs.get("temp_range_c", (0,100))[1] + 5: return f"{activity_name}: Unsuitable due to extreme heat ({temp_c}°C)."
            if condition == "Strong Wind" and wind_kmh > activity_prefs.get("max_wind_kmh", 100) + 10: return f"{activity_name}: Unsuitable due to strong winds ({wind_kmh} km/h)."
    if "require_conditions" in activity_prefs:
        all_required_met = True
        for req_condition in activity_prefs["require_conditions"]:
            if req_condition.lower() != weather_main.lower(): all_required_met = False; break
        if not all_required_met: return f"{activity_name}: Current weather ({weather_main}) does not meet required conditions (e.g., requires {', '.join(activity_prefs['require_conditions'])})."
    min_temp_ideal, max_temp_ideal = activity_prefs.get("temp_range_c", (None, None))
    min_temp_abs = activity_prefs.get("min_temp_c", None)
    if min_temp_ideal is not None and temp_c < min_temp_ideal: return f"{activity_name}: Current temperature ({temp_c}°C) is below the ideal range of {min_temp_ideal}-{max_temp_ideal}°C."
    if max_temp_ideal is not None and temp_c > max_temp_ideal: return f"{activity_name}: Current temperature ({temp_c}°C) is above the ideal range of {min_temp_ideal}-{max_temp_ideal}°C."
    if min_temp_abs is not None and temp_c < min_temp_abs: return f"{activity_name}: Current temperature ({temp_c}°C) is too cold (below {min_temp_abs}°C)."
    max_wind = activity_prefs.get("max_wind_kmh")
    if max_wind is not None and wind_kmh > max_wind: return f"{activity_name}: It's currently too windy ({wind_kmh} km/h, max {max_wind} km/h)."
    max_humidity = activity_prefs.get("max_humidity_percent")
    if max_humidity is not None and humidity > max_humidity: return f"{activity_name}: Humidity ({humidity}%) is too high (max {max_humidity}%)."
    return f"{activity_name}: Current conditions are favorable."

@app.route('/api/perfect_day_forecast', methods=['GET'])
def perfect_day_forecast():
    # ... (implementation as before) ...
    city = request.args.get('city')
    activities_str = request.args.get('activities')
    if not city or not activities_str: return jsonify({"error": "City and activities parameters are required."}), 400
    api_key = os.getenv('OPENWEATHERMAP_API_KEY')
    if not api_key: app.logger.error("OPENWEATHERMAP_API_KEY not set for perfect_day_forecast."); return jsonify({'error': 'API key not configured. Please contact administrator.'}), 500
    activity_keys_raw = [key.strip() for key in activities_str.split(',')]
    activity_keys = [key for key in activity_keys_raw if key] 
    if not activity_keys: return jsonify({"error": "No valid activities specified."}), 400
    params = {'q': city, 'appid': api_key, 'units': 'metric'}
    try:
        response = requests.get(OWM_BASE_URL, params=params)
        response.raise_for_status() 
        data = response.json()
        if 'weather' not in data or not data['weather'] or 'main' not in data or 'wind' not in data or 'coord' not in data: # Added coord check
            app.logger.error(f"Malformed weather data for city '{city}' in perfect_day_forecast. Data: {data}")
            return jsonify({'error': 'Received malformed data from weather service.'}), 500
        if 'cod' in data and str(data['cod']) != '200':
            error_message = data.get('message', 'An error occurred with the weather service.')
            status_code = int(data['cod'])
            if status_code == 401: error_message = 'Unauthorized. Check your API key for the weather service.'
            elif status_code == 404: error_message = f"City '{city}' not found by the weather service."
            elif status_code == 429: error_message = 'Rate limit exceeded with the weather service. Please try again later.'
            app.logger.warning(f"OpenWeatherMap API error for city '{city}' (perfect_day_forecast): {data.get('message')} (status: {status_code})")
            return jsonify({'error': error_message}), status_code
        current_weather_data = {
            'temperature': data['main']['temp'], 'wind_speed_ms': data['wind']['speed'], 
            'wind_speed_kmh': round(data['wind']['speed'] * 3.6, 1), 'humidity': data['main']['humidity'],
            'weather_main': data['weather'][0]['main'], 'description': data['weather'][0]['description']
        }
    except requests.exceptions.HTTPError as http_err:
        status_code = http_err.response.status_code if http_err.response is not None else 500
        error_message = 'Error fetching weather data for forecast.'
        if status_code == 401: error_message = 'Unauthorized. Invalid API key for weather service.'
        elif status_code == 404: error_message = f"Weather data for city '{city}' not found by weather service."
        elif status_code == 429: error_message = 'Rate limit exceeded with weather service. Please try again later.'
        app.logger.error(f"HTTPError for perfect_day_forecast city '{city}': {http_err}")
        return jsonify({'error': error_message}), status_code
    except requests.exceptions.Timeout: app.logger.error(f"Timeout for perfect_day_forecast city '{city}'."); return jsonify({'error': 'The request to the weather service timed out. Please try again later.'}), 504
    except requests.exceptions.RequestException as e: app.logger.error(f"RequestException for perfect_day_forecast city '{city}': {e}"); return jsonify({'error': 'Could not connect to weather service for forecast. Please check your network.'}), 503
    except Exception as e: app.logger.error(f"Unexpected error in perfect_day_forecast for city '{city}': {e}", exc_info=True); return jsonify({'error': 'An unexpected server error occurred while generating forecast.'}), 500
    suggestions = {}
    valid_activities_processed = 0
    for activity_key in activity_keys:
        if activity_key in PERFECT_DAY_ACTIVITIES:
            activity_prefs = PERFECT_DAY_ACTIVITIES[activity_key]
            suggestion_text = analyze_activity_conditions(activity_key, activity_prefs, current_weather_data)
            suggestions[activity_prefs.get("display_name", activity_key.capitalize())] = suggestion_text
            valid_activities_processed +=1
        else: app.logger.warning(f"Activity key '{activity_key}' not found. Silently ignoring.")
    if valid_activities_processed == 0 and activity_keys: return jsonify({"error": "None of the specified activities were recognized."}), 400
    return jsonify({"city": data.get('name', city), "current_weather_summary": f"{current_weather_data['temperature']}°C, {current_weather_data['description']}, Wind: {current_weather_data['wind_speed_kmh']} km/h", "suggestions": suggestions, "note": "Suggestions are based on current weather conditions. Future versions will use a multi-day forecast." }), 200

# --- Helper for Health Weather Advice ---
def check_health_condition_triggers(concern_triggers, current_weather):
    # ... (implementation as before) ...
    temp_c = current_weather['temperature']
    feels_like_c = current_weather['feels_like']
    humidity = current_weather['humidity']
    weather_main = current_weather['weather_main'].lower()
    weather_description = current_weather['description'].lower()
    if "low_temp_c" in concern_triggers and temp_c < concern_triggers["low_temp_c"]: return True
    if "high_temp_c" in concern_triggers and temp_c > concern_triggers["high_temp_c"]: return True
    if "high_feels_like_c" in concern_triggers and feels_like_c > concern_triggers["high_feels_like_c"]: return True
    if "high_temp_c_extreme" in concern_triggers and temp_c > concern_triggers["high_temp_c_extreme"]: return True
    if "high_humidity_thresh_percent" in concern_triggers and humidity > concern_triggers["high_humidity_thresh_percent"]:
        if "temp_thresh_for_humidity_check_c" in concern_triggers:
            if temp_c > concern_triggers["temp_thresh_for_humidity_check_c"]: return True
        elif "low_temp_c" in concern_triggers: 
             if temp_c < concern_triggers["low_temp_c"]: return True
        else: return True 
    if "recent_heavy_rain" in concern_triggers and concern_triggers["recent_heavy_rain"]:
        if "rain" in weather_main:
            if "heavy" in weather_description or "extreme" in weather_description or "shower" in weather_description: 
                if "moderate_temp_c" in concern_triggers:
                    min_t, max_t = concern_triggers["moderate_temp_c"]
                    if not (min_t <= temp_c <= max_t): return False 
                return True 
    return False

@app.route('/api/health_weather_advice', methods=['GET'])
def health_weather_advice():
    # ... (implementation as before) ...
    city = request.args.get('city')
    concerns_str = request.args.get('concerns')
    if not city or not concerns_str: return jsonify({"error": "City and health concerns parameters are required."}), 400
    api_key = os.getenv('OPENWEATHERMAP_API_KEY')
    if not api_key: app.logger.error("OPENWEATHERMAP_API_KEY not set for health_weather_advice."); return jsonify({'error': 'API key not configured. Please contact administrator.'}), 500
    concern_keys_raw = [key.strip() for key in concerns_str.split(',')]
    concern_keys = [key for key in concern_keys_raw if key]
    if not concern_keys: return jsonify({"error": "No valid health concerns specified."}), 400
    params = {'q': city, 'appid': api_key, 'units': 'metric'}
    try:
        response = requests.get(OWM_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        if 'weather' not in data or not data['weather'] or 'main' not in data or 'wind' not in data or 'coord' not in data: # Added coord check
            app.logger.error(f"Malformed weather data for city '{city}' in health_weather_advice. Data: {data}")
            return jsonify({'error': 'Received malformed data from weather service.'}), 500
        if 'cod' in data and str(data['cod']) != '200':
            error_message = data.get('message', 'An error occurred with the weather service.')
            status_code = int(data['cod'])
            if status_code == 401: error_message = 'Unauthorized. Check your API key for the weather service.'
            elif status_code == 404: error_message = f"City '{city}' not found by the weather service."
            elif status_code == 429: error_message = 'Rate limit exceeded with the weather service. Please try again later.'
            app.logger.warning(f"OpenWeatherMap API error for city '{city}' (health_weather_advice): {data.get('message')} (status: {status_code})")
            return jsonify({'error': error_message}), status_code
        current_weather_data = {
            'temperature': data['main']['temp'], 'feels_like': data['main']['feels_like'],
            'humidity': data['main']['humidity'], 'wind_speed_ms': data['wind']['speed'],
            'weather_main': data['weather'][0]['main'], 'description': data['weather'][0]['description']
        }
    except requests.exceptions.HTTPError as http_err:
        status_code = http_err.response.status_code if http_err.response is not None else 500
        error_message = 'Error fetching weather data for health advice.'
        if status_code == 401: error_message = 'Unauthorized. Invalid API key for weather service.'
        elif status_code == 404: error_message = f"Weather data for city '{city}' not found by weather service."
        elif status_code == 429: error_message = 'Rate limit exceeded with weather service. Please try again later.'
        app.logger.error(f"HTTPError for health_weather_advice city '{city}': {http_err}")
        return jsonify({'error': error_message}), status_code
    except requests.exceptions.Timeout: return jsonify({'error': 'The request to the weather service timed out. Please try again later.'}), 504
    except requests.exceptions.RequestException as e: app.logger.error(f"RequestException for health_weather_advice city '{city}': {e}"); return jsonify({'error': 'Could not connect to weather service for health advice. Please check your network.'}), 503
    except Exception as e: app.logger.error(f"Unexpected error in health_weather_advice for city '{city}': {e}", exc_info=True); return jsonify({'error': 'An unexpected server error occurred while generating health advice.'}), 500
    triggered_advice_list = []
    for concern_key in concern_keys:
        if concern_key in HEALTH_CONCERNS_BN:
            concern_def = HEALTH_CONCERNS_BN[concern_key]
            if check_health_condition_triggers(concern_def["triggers"], current_weather_data):
                triggered_advice_list.append(concern_def["advice"])
        else: app.logger.warning(f"Health concern key '{concern_key}' not found. Silently ignoring.")
    return jsonify({"city": data.get('name', city), "triggered_advice": triggered_advice_list, "disclaimer": "This health advice is based on general weather correlations and is not a substitute for professional medical advice."}), 200

@app.route('/api/weather_history_on_this_day', methods=['GET'])
def weather_history_on_this_day():
    # ... (implementation as before) ...
    latitude_str = request.args.get('latitude')
    longitude_str = request.args.get('longitude')
    current_date_str = request.args.get('current_date')
    if not all([latitude_str, longitude_str, current_date_str]): return jsonify({"error": "Latitude, longitude, and current_date parameters are required."}), 400
    try:
        latitude = float(latitude_str); longitude = float(longitude_str)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180): raise ValueError("Lat/lon out of range.")
    except ValueError: return jsonify({"error": "Invalid latitude or longitude format or value."}), 400
    try: today_date_obj = datetime.strptime(current_date_str, "%Y-%m-%d")
    except ValueError: return jsonify({"error": "Invalid current_date format. Please use YYYY-MM-DD."}), 400
    current_month = today_date_obj.month; current_day = today_date_obj.day; current_year_for_loop = today_date_obj.year
    historical_results = []
    for i in range(1, 4):
        target_hist_year = current_year_for_loop - i
        historical_date_to_fetch = f"{target_hist_year:04d}-{current_month:02d}-{current_day:02d}"
        api_url = (f"{OPEN_METEO_HISTORICAL_URL}?latitude={latitude}&longitude={longitude}"
                   f"&start_date={historical_date_to_fetch}&end_date={historical_date_to_fetch}"
                   f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto")
        try:
            response = requests.get(api_url, timeout=10); response.raise_for_status(); data = response.json()
            daily_data = data.get('daily')
            if not daily_data: raise ValueError("Open-Meteo: 'daily' data key missing.")
            max_temps = daily_data.get('temperature_2m_max'); min_temps = daily_data.get('temperature_2m_min')
            precip_sums = daily_data.get('precipitation_sum'); dates = daily_data.get('time')
            if not (dates and isinstance(dates, list) and len(dates) > 0 and
                    max_temps and isinstance(max_temps, list) and len(max_temps) > 0 and
                    min_temps and isinstance(min_temps, list) and len(min_temps) > 0 and
                    precip_sums and isinstance(precip_sums, list) and len(precip_sums) > 0):
                raise ValueError("Open-Meteo: Expected daily data arrays not found or empty.")
            if dates[0] != historical_date_to_fetch: app.logger.warning(f"Open-Meteo date mismatch for {historical_date_to_fetch}. Got {dates[0]}")
            historical_results.append({
                "year": target_hist_year, "date": historical_date_to_fetch, 
                "max_temp": max_temps[0] if max_temps[0] is not None else "N/A",
                "min_temp": min_temps[0] if min_temps[0] is not None else "N/A",
                "precipitation": precip_sums[0] if precip_sums[0] is not None else "N/A"
            })
        except requests.exceptions.Timeout: app.logger.error(f"Timeout fetching Open-Meteo for {historical_date_to_fetch}"); historical_results.append({"year": target_hist_year, "date": historical_date_to_fetch, "error": "Timeout fetching data for this year."})
        except requests.exceptions.HTTPError as e: app.logger.error(f"HTTPError Open-Meteo for {historical_date_to_fetch}: {e}"); historical_results.append({"year": target_hist_year, "date": historical_date_to_fetch, "error": f"Weather service error (HTTP {e.response.status_code})."})
        except requests.exceptions.RequestException as e: app.logger.error(f"RequestException Open-Meteo for {historical_date_to_fetch}: {e}"); historical_results.append({"year": target_hist_year, "date": historical_date_to_fetch, "error": "Network error for this year."})
        except (ValueError, KeyError) as e: app.logger.error(f"Data error Open-Meteo for {historical_date_to_fetch}: {e}. Data: {data if 'data' in locals() else 'N/A'}"); historical_results.append({"year": target_hist_year, "date": historical_date_to_fetch, "error": "Data format error for this year."})
        except Exception as e: app.logger.error(f"Unexpected error Open-Meteo for {historical_date_to_fetch}: {e}", exc_info=True); historical_results.append({"year": target_hist_year, "date": historical_date_to_fetch, "error": "Unexpected error for this year."})
    return jsonify({"history": historical_results})

if __name__ == '__main__':
    app.run(debug=True)
