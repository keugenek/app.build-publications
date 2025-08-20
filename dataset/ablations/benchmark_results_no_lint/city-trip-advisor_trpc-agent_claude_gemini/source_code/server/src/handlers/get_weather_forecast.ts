import { type WeatherForecast } from '../schema';

// Open-Meteo API interfaces
interface GeocodingResult {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }>;
}

interface WeatherResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

// Weather code mapping based on WMO codes used by Open-Meteo
const getWeatherDescription = (code: number): string => {
  const weatherCodes: Record<number, string> = {
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

  return weatherCodes[code] || 'Unknown weather';
};

export async function getWeatherForecast(city: string): Promise<WeatherForecast> {
  try {
    // Step 1: Get coordinates for the city using geocoding
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    
    const geocodingResponse = await fetch(geocodingUrl);
    if (!geocodingResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodingResponse.status}`);
    }
    
    const geocodingData = await geocodingResponse.json() as GeocodingResult;
    
    if (!geocodingData.results || geocodingData.results.length === 0) {
      throw new Error(`City "${city}" not found`);
    }
    
    const { latitude, longitude } = geocodingData.results[0];
    
    // Step 2: Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Step 3: Fetch weather forecast for tomorrow
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_sum,weather_code&start_date=${tomorrowStr}&end_date=${tomorrowStr}&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json() as WeatherResponse;
    
    // Step 4: Extract and format weather data
    if (!weatherData.daily || weatherData.daily.time.length === 0) {
      throw new Error('No weather data available for tomorrow');
    }
    
    const temperature = weatherData.daily.temperature_2m_max[0];
    const precipitation = weatherData.daily.precipitation_sum[0];
    const weatherCode = weatherData.daily.weather_code[0];
    const weather_description = getWeatherDescription(weatherCode);
    
    return {
      temperature,
      precipitation,
      weather_description
    };
  } catch (error) {
    console.error('Weather forecast failed:', error);
    throw error;
  }
}
