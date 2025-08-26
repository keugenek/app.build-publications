import { db } from '../db';
import { weatherCacheTable } from '../db/schema';
import { type GetTripSuggestionInput, type TripSuggestion, type WeatherData } from '../schema';
import { eq, and } from 'drizzle-orm';

// Function to fetch weather data from Open-Meteo API
async function fetchWeatherFromAPI(city: string, date: string): Promise<WeatherData> {
  try {
    // First, get coordinates for the city using the geocoding API
    const geocodeResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodeResponse.status}`);
    }
    
    const geocodeData = await geocodeResponse.json() as any;
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`City "${city}" not found`);
    }
    
    const { latitude, longitude } = geocodeData.results[0];
    
    // Fetch weather data using coordinates
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_sum,weather_code&start_date=${date}&end_date=${date}&timezone=auto`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json() as any;
    
    if (!weatherData.daily || !weatherData.daily.temperature_2m_max || weatherData.daily.temperature_2m_max.length === 0) {
      throw new Error(`No weather data available for ${city} on ${date}`);
    }
    
    // Map weather codes to descriptions (simplified mapping)
    const weatherCodeMap: { [key: number]: string } = {
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
      95: 'Thunderstorm',
    };
    
    const weatherCode = weatherData.daily.weather_code[0];
    const weatherDescription = weatherCodeMap[weatherCode] || 'Unknown weather';
    
    return {
      temperature: weatherData.daily.temperature_2m_max[0],
      precipitation: weatherData.daily.precipitation_sum[0] || 0,
      weather_description: weatherDescription,
      date: date
    };
  } catch (error) {
    console.error('Failed to fetch weather data from API:', error);
    throw error;
  }
}

// Function to determine if the weather is good for a trip
function isGoodTripWeather(temperature: number, precipitation: number): { isGood: boolean; reason: string } {
  const reasons: string[] = [];
  
  // Temperature check: ideal range is 10°C to 25°C
  if (temperature < 10) {
    reasons.push('temperature too cold');
  } else if (temperature > 25) {
    reasons.push('temperature too hot');
  } else {
    reasons.push('pleasant temperature');
  }
  
  // Precipitation check: minimal precipitation is preferred
  if (precipitation > 10) {
    reasons.push('high precipitation expected');
  } else if (precipitation > 5) {
    reasons.push('moderate precipitation expected');
  } else if (precipitation > 0) {
    reasons.push('light precipitation possible');
  } else {
    reasons.push('no precipitation expected');
  }
  
  const isGood = temperature >= 10 && temperature <= 25 && precipitation <= 5;
  const reason = isGood 
    ? `Good conditions: ${reasons.join(', ')}`
    : `Unfavorable conditions: ${reasons.join(', ')}`;
    
  return { isGood, reason };
}

export async function getTripSuggestion(input: GetTripSuggestionInput): Promise<TripSuggestion> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if we have cached weather data for this city and date
    const cachedWeather = await db.select()
      .from(weatherCacheTable)
      .where(and(
        eq(weatherCacheTable.city, input.city),
        eq(weatherCacheTable.date, tomorrowDate)
      ))
      .limit(1)
      .execute();
    
    let weatherData: WeatherData;
    
    if (cachedWeather.length > 0) {
      // Use cached data
      const cached = cachedWeather[0];
      weatherData = {
        temperature: cached.temperature,
        precipitation: cached.precipitation,
        weather_description: cached.weather_description,
        date: cached.date
      };
    } else {
      // Fetch fresh data from API
      weatherData = await fetchWeatherFromAPI(input.city, tomorrowDate);
      
      // Cache the weather data for future requests
      await db.insert(weatherCacheTable)
        .values({
          city: input.city,
          temperature: weatherData.temperature,
          precipitation: weatherData.precipitation,
          weather_description: weatherData.weather_description,
          date: weatherData.date
        })
        .execute();
    }
    
    // Determine if it's a good idea for a trip
    const { isGood, reason } = isGoodTripWeather(weatherData.temperature, weatherData.precipitation);
    
    return {
      city: input.city,
      is_good_idea: isGood,
      temperature: weatherData.temperature,
      precipitation: weatherData.precipitation,
      weather_description: weatherData.weather_description,
      date: weatherData.date,
      reason: reason
    };
  } catch (error) {
    console.error('Trip suggestion failed:', error);
    throw error;
  }
}
