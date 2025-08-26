import { db } from '../db';
import { weatherCacheTable } from '../db/schema';
import { type CreateWeatherCacheInput, type WeatherCache } from '../schema';

export const cacheWeatherData = async (input: CreateWeatherCacheInput): Promise<WeatherCache> => {
  try {
    // Insert weather cache record
    const result = await db.insert(weatherCacheTable)
      .values({
        city: input.city,
        temperature: input.temperature, // real column - no conversion needed
        precipitation: input.precipitation, // real column - no conversion needed
        weather_description: input.weather_description,
        date: input.date // date column - string input works directly
      })
      .returning()
      .execute();

    // Return the created cache entry (no numeric conversions needed for real columns)
    const cacheEntry = result[0];
    return {
      ...cacheEntry,
      created_at: cacheEntry.created_at // Already a Date object from timestamp column
    };
  } catch (error) {
    console.error('Weather cache creation failed:', error);
    throw error;
  }
};
