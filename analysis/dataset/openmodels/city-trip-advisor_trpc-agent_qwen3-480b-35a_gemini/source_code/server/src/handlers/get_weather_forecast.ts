import { type GetWeatherInput, type WeatherForecast } from '../schema';

// Types for Open-Meteo API responses
type GeoResponse = {
  results?: Array<{
    latitude: number;
    longitude: number;
  }>;
};

type WeatherResponse = {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    precipitation_probability_mean: number[];
  };
};

// Function to fetch city coordinates using Open-Meteo's geocoding API
async function getCityCoordinates(city: string) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  
  try {
    const response = await fetch(geoUrl);
    const data = (await response.json()) as GeoResponse;
    
    if (data.results && data.results.length > 0) {
      const { latitude, longitude } = data.results[0];
      return { latitude, longitude };
    }
    
    throw new Error(`City "${city}" not found`);
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
    throw error;
  }
}

// Function to fetch weather forecast using Open-Meteo's forecast API
async function getForecast(latitude: number, longitude: number) {
  // Get tomorrow's date in YYYY-MM-DD format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  
  // Fetch the weather forecast for tomorrow
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_probability_mean&timezone=auto&forecast_days=1`;
  
  try {
    const response = await fetch(weatherUrl);
    const data = (await response.json()) as WeatherResponse;
    
    if (data.daily && data.daily.time.length > 0) {
      const index = data.daily.time.findIndex((date: string) => date === tomorrowDate);
      
      if (index !== -1) {
        return {
          date: tomorrowDate,
          temperature: data.daily.temperature_2m_max[index],
          precipitation_probability: data.daily.precipitation_probability_mean[index],
        };
      }
    }
    
    throw new Error('Weather forecast not available for tomorrow');
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}

export const getWeatherForecast = async (input: GetWeatherInput): Promise<WeatherForecast> => {
  try {
    // Get city coordinates
    const { latitude, longitude } = await getCityCoordinates(input.city);
    
    // Get weather forecast
    const forecast = await getForecast(latitude, longitude);
    
    // Determine if it's a good idea based on criteria:
    // - Temperature between 10°C and 25°C
    // - Probability of precipitation less than 30%
    const isGoodIdea = 
      forecast.temperature >= 10 && 
      forecast.temperature <= 25 && 
      forecast.precipitation_probability < 30;
    
    return {
      city: input.city,
      date: forecast.date,
      temperature: forecast.temperature,
      precipitation_probability: forecast.precipitation_probability,
      is_good_idea: isGoodIdea,
    };
  } catch (error) {
    console.error('Error in getWeatherForecast:', error);
    throw error;
  }
};
