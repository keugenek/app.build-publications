import { type CityInput, type WeatherForecast } from '../schema';

// Type definitions for Open-Meteo API responses
type GeocodingResponse = {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
  }>;
};

type ForecastResponse = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    precipitation_probability_mean: number[];
  };
};

// Function to get coordinates for a city using Open-Meteo's geocoding API
async function getCityCoordinates(cityName: string): Promise<{ latitude: number; longitude: number; name: string }> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch city coordinates');
  }
  
  const data = await response.json() as GeocodingResponse;
  
  if (!data.results || data.results.length === 0) {
    throw new Error('City not found');
  }
  
  const { latitude, longitude, name } = data.results[0];
  return { latitude, longitude, name };
}

// Function to get weather forecast from Open-Meteo API
async function getForecast(latitude: number, longitude: number): Promise<ForecastResponse> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_probability_mean&timezone=auto&forecast_days=2`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather forecast');
  }
  
  return await response.json() as ForecastResponse;
}

export const getWeatherForecast = async (input: CityInput): Promise<WeatherForecast> => {
  try {
    // Get city coordinates
    const { latitude, longitude, name: cityName } = await getCityCoordinates(input.cityName);
    
    // Get weather forecast
    const forecastData = await getForecast(latitude, longitude);
    
    // Get tomorrow's forecast (index 1, as index 0 is today)
    const tomorrowIndex = 1;
    const maxTemperature = forecastData.daily.temperature_2m_max[tomorrowIndex];
    const precipitationProbability = forecastData.daily.precipitation_probability_mean[tomorrowIndex];
    const forecastDate = forecastData.daily.time[tomorrowIndex];
    
    // Determine if it's a good idea to visit based on criteria
    const isGoodIdea = 
      maxTemperature >= 15 && 
      maxTemperature <= 25 && 
      precipitationProbability < 30;
    
    return {
      city: cityName,
      maxTemperature,
      precipitationProbability,
      isGoodIdea,
      forecastDate,
    };
  } catch (error) {
    throw new Error(`Failed to get weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
