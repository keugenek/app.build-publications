import { type WeatherForecast } from '../schema';
import { db } from '../db';
import { citiesTable, weatherForecastsTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const saveWeatherForecast = async (forecast: WeatherForecast): Promise<void> => {
  try {
    // First, check if the city already exists
    let cityResult = await db.select()
      .from(citiesTable)
      .where(eq(citiesTable.name, forecast.city))
      .limit(1)
      .execute();
    
    let cityId: number;
    
    if (cityResult.length === 0) {
      // City doesn't exist, insert it
      // For simplicity, we'll use default values for country and coordinates
      const newCityResult = await db.insert(citiesTable)
        .values({
          name: forecast.city,
          country: 'Unknown',
          latitude: '0.0000000',
          longitude: '0.0000000'
        })
        .returning({ id: citiesTable.id })
        .execute();
      
      cityId = newCityResult[0].id;
    } else {
      // City exists, use its ID
      cityId = cityResult[0].id;
    }
    
    // Insert the weather forecast
    await db.insert(weatherForecastsTable)
      .values({
        city_id: cityId,
        date: new Date(forecast.date), // Convert string date to Date object
        temperature: forecast.temperature.toString(), // Convert number to string for numeric column
        precipitation_probability: forecast.precipitation_probability
      })
      .execute();
  } catch (error) {
    console.error('Failed to save weather forecast:', error);
    throw error;
  }
};
