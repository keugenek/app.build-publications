import { type TripSuggestionInput, type TripSuggestionResponse, type WeatherForecast } from '../schema';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';

// Mock weather data for demonstration - in real app this would call an API
const getWeatherForecast = async (city: string): Promise<WeatherForecast> => {
  // Simple mock that varies by city name for testing
  const cityHash = city.toLowerCase().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const temperature = 15 + (cityHash % 20); // Temperature between 15-35°C
  const precipitation = Math.abs(cityHash % 10); // Precipitation 0-9mm
  
  const descriptions = ['Sunny', 'Cloudy', 'Light rain', 'Heavy rain', 'Snowy', 'Partly cloudy'];
  const weather_description = descriptions[Math.abs(cityHash % descriptions.length)];
  
  return {
    temperature,
    precipitation,
    weather_description
  };
};

// Evaluate if trip is a good idea based on weather conditions
const evaluateTripSuggestion = (city: string, weather: WeatherForecast): TripSuggestionResponse => {
  let isGoodIdea = true;
  let message = `Great weather for a trip to ${city}!`;
  
  // Trip is not a good idea if too cold
  if (weather.temperature < 5) {
    isGoodIdea = false;
    message = `It's quite cold in ${city} (${weather.temperature}°C). Consider packing warm clothes or postponing your trip.`;
  }
  // Trip is not a good idea if heavy rain
  else if (weather.precipitation > 5) {
    isGoodIdea = false;
    message = `Heavy rain expected in ${city} (${weather.precipitation}mm). Maybe wait for better weather.`;
  }
  // Trip is okay but with warnings
  else if (weather.temperature < 15 || weather.precipitation > 2) {
    message = `Weather in ${city} is okay but be prepared for ${weather.weather_description.toLowerCase()} conditions.`;
  }
  
  return {
    isGoodIdea,
    message,
    city,
    weather
  };
};

// Save trip suggestion to database
const saveTripSuggestion = async (suggestion: TripSuggestionResponse): Promise<void> => {
  try {
    await db.insert(tripSuggestionsTable)
      .values({
        city: suggestion.city,
        temperature: suggestion.weather.temperature.toString(),
        precipitation: suggestion.weather.precipitation.toString(),
        is_good_idea: suggestion.isGoodIdea,
        message: suggestion.message
      })
      .execute();
  } catch (error) {
    console.error('Failed to save trip suggestion:', error);
    throw error;
  }
};

export async function getTripSuggestion(input: TripSuggestionInput): Promise<TripSuggestionResponse> {
  try {
    // Get weather forecast for the city
    const weather = await getWeatherForecast(input.city);
    
    // Evaluate if trip is a good idea
    const suggestion = evaluateTripSuggestion(input.city, weather);
    
    // Save suggestion to database (fire and forget)
    saveTripSuggestion(suggestion).catch(console.error);
    
    return suggestion;
  } catch (error) {
    // Handle errors gracefully
    console.error('Failed to get trip suggestion:', error);
    
    return {
      isGoodIdea: false,
      message: "Sorry, we couldn't get weather information for this city. Please try again.",
      city: input.city,
      weather: {
        temperature: 0,
        precipitation: 0,
        weather_description: 'Unknown'
      }
    };
  }
}
