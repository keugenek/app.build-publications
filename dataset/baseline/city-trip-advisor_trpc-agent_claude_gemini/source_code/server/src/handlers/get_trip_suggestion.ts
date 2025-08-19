import { db } from '../db';
import { tripHistoryTable } from '../db/schema';
import { type TripSuggestionInput, type TripSuggestion, weatherDataSchema, type CreateTripHistoryInput } from '../schema';

// Weather code descriptions based on Open-Meteo API
const getWeatherDescription = (weatherCode: number): string => {
  const descriptions: Record<number, string> = {
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
  
  return descriptions[weatherCode] || 'Unknown weather condition';
};

// Geocoding function to get coordinates for a city
const getCoordinates = async (city: string): Promise<{ lat: number; lon: number }> => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  
  try {
    const response = await fetch(geocodingUrl);
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.results || data.results.length === 0) {
      throw new Error(`City "${city}" not found`);
    }
    
    const result = data.results[0];
    return {
      lat: result.latitude,
      lon: result.longitude
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    throw new Error(`Failed to find coordinates for city: ${city}`);
  }
};

// Fetch weather data from Open-Meteo API
const getWeatherData = async (lat: number, lon: number, date: string) => {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum,weather_code&start_date=${date}&end_date=${date}`;
  
  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`Weather API failed: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.daily || !data.daily.temperature_2m_max || data.daily.temperature_2m_max.length === 0) {
      throw new Error('No weather data available for the requested date');
    }
    
    // Parse and validate weather data
    const weatherData = {
      temperature_max: data.daily.temperature_2m_max[0],
      precipitation_sum: data.daily.precipitation_sum[0] || 0,
      weather_code: data.daily.weather_code[0]
    };
    
    return weatherDataSchema.parse(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    if (error instanceof Error && error.message.includes('No weather data available')) {
      throw error;
    }
    throw new Error('Failed to fetch weather data');
  }
};

// Analyze weather conditions to determine if it's a good trip idea
const analyzeWeatherForTrip = (weatherData: { temperature_max: number; precipitation_sum: number; weather_code: number }) => {
  const { temperature_max, precipitation_sum, weather_code } = weatherData;
  
  // Check temperature range (10-25°C is ideal)
  const isGoodTemperature = temperature_max >= 10 && temperature_max <= 25;
  
  // Check precipitation (less than 5mm is acceptable)
  const isLowPrecipitation = precipitation_sum < 5;
  
  // Check for severe weather codes
  const isSevereWeather = weather_code >= 95; // Thunderstorms and severe conditions
  
  let reason = '';
  let is_good_idea = false;
  
  if (isSevereWeather) {
    reason = 'Severe weather conditions expected (thunderstorms or hail)';
    is_good_idea = false;
  } else if (!isGoodTemperature && !isLowPrecipitation) {
    if (temperature_max < 10) {
      reason = `Too cold (${temperature_max}°C) and rainy (${precipitation_sum}mm) for a comfortable trip`;
    } else if (temperature_max > 25) {
      reason = `Too hot (${temperature_max}°C) and rainy (${precipitation_sum}mm) for a comfortable trip`;
    } else {
      reason = `Heavy precipitation expected (${precipitation_sum}mm)`;
    }
    is_good_idea = false;
  } else if (!isGoodTemperature) {
    if (temperature_max < 10) {
      reason = `Weather is too cold (${temperature_max}°C) for a comfortable trip`;
    } else {
      reason = `Weather is too hot (${temperature_max}°C) for a comfortable trip`;
    }
    is_good_idea = false;
  } else if (!isLowPrecipitation) {
    reason = `Heavy precipitation expected (${precipitation_sum}mm)`;
    is_good_idea = false;
  } else {
    reason = `Perfect weather conditions - comfortable temperature (${temperature_max}°C) with minimal precipitation`;
    is_good_idea = true;
  }
  
  return { is_good_idea, reason };
};

// Save trip suggestion to database
const saveTripHistory = async (input: CreateTripHistoryInput): Promise<void> => {
  try {
    await db.insert(tripHistoryTable)
      .values({
        city: input.city,
        is_good_idea: input.is_good_idea,
        max_temperature: input.max_temperature,
        precipitation: input.precipitation,
        weather_description: input.weather_description,
        forecast_date: new Date(input.forecast_date)
      })
      .execute();
  } catch (error) {
    console.error('Failed to save trip history:', error);
    // Don't throw here - we still want to return the suggestion even if saving fails
  }
};

export async function getTripSuggestion(input: TripSuggestionInput): Promise<TripSuggestion> {
  try {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Step 1: Get coordinates for the city
    const coordinates = await getCoordinates(input.city);
    
    // Step 2: Fetch weather data for tomorrow
    const weatherData = await getWeatherData(coordinates.lat, coordinates.lon, tomorrowDate);
    
    // Step 3: Get weather description
    const weather_description = getWeatherDescription(weatherData.weather_code);
    
    // Step 4: Analyze weather conditions
    const analysis = analyzeWeatherForTrip(weatherData);
    
    // Step 5: Create the trip suggestion response
    const tripSuggestion: TripSuggestion = {
      city: input.city,
      is_good_idea: analysis.is_good_idea,
      reason: analysis.reason,
      weather_details: {
        max_temperature: weatherData.temperature_max,
        precipitation: weatherData.precipitation_sum,
        weather_description
      },
      forecast_date: tomorrowDate
    };
    
    // Step 6: Save to trip history (don't await to avoid blocking the response)
    const historyInput: CreateTripHistoryInput = {
      city: input.city,
      is_good_idea: analysis.is_good_idea,
      max_temperature: weatherData.temperature_max,
      precipitation: weatherData.precipitation_sum,
      weather_description,
      forecast_date: tomorrowDate
    };
    
    // Save asynchronously without blocking the response
    saveTripHistory(historyInput);
    
    return tripSuggestion;
    
  } catch (error) {
    console.error('Trip suggestion failed:', error);
    throw error;
  }
}
