import { db } from '../db';
import { citiesTable, weatherForecastsTable } from '../db/schema';
import { type WeatherForecast } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getHistoricalForecasts = async (city: string): Promise<WeatherForecast[]> => {
  try {
    // First, find the city by name
    const cities = await db.select()
      .from(citiesTable)
      .where(eq(citiesTable.name, city))
      .execute();
    
    if (cities.length === 0) {
      // If city doesn't exist, return empty array
      return [];
    }
    
    const cityRecord = cities[0];
    
    // Get weather forecasts for this city, ordered by date
    const forecasts = await db.select()
      .from(weatherForecastsTable)
      .where(eq(weatherForecastsTable.city_id, cityRecord.id))
      .orderBy(asc(weatherForecastsTable.date))
      .execute();
    
    // Transform database results to match WeatherForecast schema
    return forecasts.map(forecast => ({
      city: cityRecord.name,
      date: forecast.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      temperature: parseFloat(forecast.temperature), // Convert numeric to number
      precipitation_probability: forecast.precipitation_probability,
      is_good_idea: forecast.precipitation_probability < 50 // Good idea if precipitation < 50%
    }));
  } catch (error) {
    console.error('Failed to fetch historical forecasts:', error);
    throw error;
  }
};
