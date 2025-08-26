import { type TripSuggestionInput, type WeatherData } from '../schema';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Type definitions for Open-Meteo API responses
type GeocodingResponse = {
  results?: Array<{
    latitude: number;
    longitude: number;
  }>;
};

type WeatherForecastResponse = {
  daily: {
    temperature_2m_max: number[];
    precipitation_probability_mean: number[];
  };
};

// Function to get coordinates for a city using Open-Meteo's geocoding API
async function getCityCoordinates(city: string): Promise<{ latitude: number; longitude: number }> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch city coordinates');
  }
  
  const data = (await response.json()) as GeocodingResponse;
  
  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }
  
  const { latitude, longitude } = data.results[0];
  return { latitude, longitude };
}

// Function to get weather forecast from Open-Meteo
async function getWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecastResponse> {
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_probability_mean&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = (await response.json()) as WeatherForecastResponse;
  return data;
}

export const getTripSuggestion = async (input: TripSuggestionInput): Promise<WeatherData> => {
  try {
    // Get city coordinates
    const { latitude, longitude } = await getCityCoordinates(input.city);
    
    // Get weather forecast
    const forecast = await getWeatherForecast(latitude, longitude);
    
    // Extract tomorrow's data
    const maxTemperature = forecast.daily.temperature_2m_max[0];
    const precipitationProbability = forecast.daily.precipitation_probability_mean[0];
    
    // Determine if it's a good idea to visit
    const isGoodIdea = maxTemperature >= 15 && maxTemperature <= 25 && precipitationProbability < 30;
    
    // Save to database for logging purposes
    try {
      await db.insert(tripSuggestionsTable).values({
        city: input.city,
        max_temperature: maxTemperature.toString(), // Convert number to string for numeric column
        precipitation_probability: precipitationProbability,
        is_good_idea: isGoodIdea ? '1' : '0', // Convert boolean to numeric string
      }).execute();
    } catch (dbError) {
      console.error('Failed to save trip suggestion to database:', dbError);
      // Continue execution even if database save fails
    }
    
    return {
      city: input.city,
      maxTemperature,
      precipitationProbability,
      isGoodIdea,
    };
  } catch (error: any) {
    throw new Error(`Failed to get trip suggestion: ${error.message}`);
  }
};
