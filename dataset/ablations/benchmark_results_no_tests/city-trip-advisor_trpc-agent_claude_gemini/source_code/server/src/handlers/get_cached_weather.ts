import { db } from '../db';
import { weatherCacheTable } from '../db/schema';
import { type WeatherCache } from '../schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function getCachedWeather(city: string, date: string): Promise<WeatherCache | null> {
  try {
    // Consider data fresh if created within last 4 hours
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    // Query for cached weather data with case-insensitive city matching
    const results = await db.select()
      .from(weatherCacheTable)
      .where(
        and(
          sql`LOWER(${weatherCacheTable.city}) = LOWER(${city})`, // Case-insensitive city match
          eq(weatherCacheTable.date, date),
          gte(weatherCacheTable.created_at, fourHoursAgo) // Only fresh data
        )
      )
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const cachedData = results[0];

    // Convert real/float fields back to numbers and ensure proper typing
    return {
      ...cachedData,
      temperature: cachedData.temperature, // real column - already a number
      precipitation: cachedData.precipitation, // real column - already a number
    };
  } catch (error) {
    console.error('Failed to get cached weather:', error);
    throw error;
  }
}
