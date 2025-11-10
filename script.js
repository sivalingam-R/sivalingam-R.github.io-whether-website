const API_KEY = '41e35a54463c5b55052b2bb1a120d58e';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const currentWeather = document.getElementById('currentWeather');
const forecast = document.getElementById('forecast');

// Event listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

async function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    hideError();
    showLoading();
    hideWeather();

    try {
        await Promise.all([
            fetchCurrentWeather(city),
            fetchForecast(city)
        ]);
    } catch (err) {
        showError('Failed to fetch weather data. Please try again.');
        console.error('Error:', err);
    } finally {
        hideLoading();
    }
}

async function fetchCurrentWeather(city) {
    try {
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the city name.');
            }
            throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        displayCurrentWeather(data);
    } catch (err) {
        showError(err.message);
        throw err;
    }
}

async function fetchForecast(city) {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }

        const data = await response.json();
        displayForecast(data);
    } catch (err) {
        showError(err.message);
        throw err;
    }
}

function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temp').textContent = Math.round(data.main.temp);
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('description').textContent = data.weather[0].description;
    
    const iconCode = data.weather[0].icon;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weatherIcon').alt = data.weather[0].description;

    currentWeather.classList.remove('hidden');
}

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    // Group forecast by day and get daily high/low
    const dailyForecast = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyForecast[dateKey]) {
            dailyForecast[dateKey] = {
                date: date,
                temps: [],
                conditions: [],
                icons: []
            };
        }
        
        dailyForecast[dateKey].temps.push(item.main.temp);
        dailyForecast[dateKey].conditions.push(item.weather[0]);
        dailyForecast[dateKey].icons.push(item.weather[0].icon);
    });

    // Get first 5 days
    const forecastDays = Object.values(dailyForecast).slice(0, 5);

    forecastDays.forEach(day => {
        const high = Math.round(Math.max(...day.temps));
        const low = Math.round(Math.min(...day.temps));
        const mostCommonCondition = getMostCommon(day.conditions);
        const mostCommonIcon = getMostCommon(day.icons);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const dateStr = formatDate(day.date);
        
        card.innerHTML = `
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png" alt="${mostCommonCondition.description}" />
            </div>
            <div class="forecast-temp">${high}°C</div>
            <div class="forecast-description">${mostCommonCondition.description}</div>
            <div class="forecast-high-low">
                <span class="forecast-high">H: ${high}°</span>
                <span class="forecast-low">L: ${low}°</span>
            </div>
        `;

        forecastContainer.appendChild(card);
    });

    forecast.classList.remove('hidden');
}

function getMostCommon(arr) {
    const counts = {};
    arr.forEach(item => {
        const key = typeof item === 'string' ? item : JSON.stringify(item);
        counts[key] = (counts[key] || 0) + 1;
    });
    
    const mostCommon = Object.keys(counts).reduce((a, b) => 
        counts[a] > counts[b] ? a : b
    );
    
    return typeof arr[0] === 'string' ? mostCommon : JSON.parse(mostCommon);
}

function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    
    return `${dayName}, ${month} ${day}`;
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

function hideWeather() {
    currentWeather.classList.add('hidden');
    forecast.classList.add('hidden');
}

