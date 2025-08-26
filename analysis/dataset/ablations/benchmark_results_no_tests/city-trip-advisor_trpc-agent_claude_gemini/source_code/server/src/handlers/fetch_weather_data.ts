import { type WeatherData } from '../schema';

// Weather code to description mapping (simplified)
const weatherDescriptions: { [key: number]: string } = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

interface GeocodingResponse {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }>;
}

interface WeatherResponse {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
  };
}

export async function fetchWeatherData(city: string, date: string): Promise<WeatherData> {
  try {
    // Step 1: Geocoding to get coordinates for the city
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;
    
    const geocodingResponse = await fetch(geocodingUrl);
    if (!geocodingResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodingResponse.status}`);
    }
    
    const geocodingData = await geocodingResponse.json() as GeocodingResponse;
    
    if (!geocodingData.results || geocodingData.results.length === 0) {
      throw new Error(`City not found: ${city}`);
    }
    
    const { latitude, longitude } = geocodingData.results[0];
    
    // Step 2: Fetch weather data using coordinates and date
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&start_date=${date}&end_date=${date}`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json() as WeatherResponse;
    
    if (!weatherData.daily || !weatherData.daily.time || weatherData.daily.time.length === 0) {
      throw new Error(`No weather data available for ${city} on ${date}`);
    }
    
    // Step 3: Extract and process weather information
    const dailyData = weatherData.daily;
    const tempMax = dailyData.temperature_2m_max[0];
    const tempMin = dailyData.temperature_2m_min[0];
    const precipitation = dailyData.precipitation_sum[0];
    const weatherCode = dailyData.weathercode[0];
    
    // Calculate average temperature
    const avgTemperature = Math.round(((tempMax + tempMin) / 2) * 10) / 10; // Round to 1 decimal place
    
    // Get weather description from code
    const weatherDescription = weatherDescriptions[weatherCode] || 'Unknown weather';
    
    return {
      temperature: avgTemperature,
      precipitation: precipitation || 0,
      weather_description: weatherDescription,
      date: date
    };
    
  } catch (error) {
    console.error('Weather data fetch failed:', error);
    throw error;
  }
}
