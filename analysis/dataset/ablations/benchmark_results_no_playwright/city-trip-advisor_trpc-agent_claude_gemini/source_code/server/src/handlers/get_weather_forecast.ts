import { type WeatherForecast } from '../schema';

interface GeocodeResult {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }>;
}

interface WeatherApiResponse {
  daily: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
  };
}

/**
 * Fetches tomorrow's weather forecast for a given city using OpenMeteo API
 * This handler is responsible for making external API calls to get weather data
 */
export async function getWeatherForecast(city: string): Promise<WeatherForecast> {
  try {
    // Step 1: Geocode the city name to get coordinates
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodeResponse.status} ${geocodeResponse.statusText}`);
    }

    const geocodeData = await geocodeResponse.json() as GeocodeResult;
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`City "${city}" not found`);
    }

    const { latitude, longitude } = geocodeData.results[0];

    // Step 2: Get tomorrow's date for the forecast
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Step 3: Fetch weather forecast from OpenMeteo API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum&timezone=UTC&start_date=${tomorrowStr}&end_date=${tomorrowStr}`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
    }

    const weatherData = await weatherResponse.json() as WeatherApiResponse;

    // Step 4: Extract and validate forecast data
    if (!weatherData.daily || !weatherData.daily.time || weatherData.daily.time.length === 0) {
      throw new Error('No weather data available for tomorrow');
    }

    const forecastDate = weatherData.daily.time[0];
    const tempMin = weatherData.daily.temperature_2m_min[0];
    const tempMax = weatherData.daily.temperature_2m_max[0];
    const precipitation = weatherData.daily.precipitation_sum[0];

    // Step 5: Validate that we have all required data
    if (typeof tempMin !== 'number' || typeof tempMax !== 'number' || typeof precipitation !== 'number') {
      throw new Error('Invalid weather data received from API');
    }

    return {
      temperature_min: tempMin,
      temperature_max: tempMax,
      precipitation: precipitation,
      date: forecastDate
    };

  } catch (error) {
    console.error('Weather forecast fetch failed:', error);
    throw error;
  }
}
