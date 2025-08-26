import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherCacheTable } from '../db/schema';
import { type CreateWeatherCacheInput } from '../schema';
import { cacheWeatherData } from '../handlers/cache_weather_data';
import { eq, and, gte } from 'drizzle-orm';

// Test input for weather cache
const testInput: CreateWeatherCacheInput = {
  city: 'London',
  temperature: 15.5,
  precipitation: 2.3,
  weather_description: 'Partly cloudy',
  date: '2024-01-15'
};

describe('cacheWeatherData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cache weather data', async () => {
    const result = await cacheWeatherData(testInput);

    // Basic field validation
    expect(result.city).toEqual('London');
    expect(result.temperature).toEqual(15.5);
    expect(result.precipitation).toEqual(2.3);
    expect(result.weather_description).toEqual('Partly cloudy');
    expect(result.date).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify numeric types are preserved correctly
    expect(typeof result.temperature).toBe('number');
    expect(typeof result.precipitation).toBe('number');
  });

  it('should save weather cache to database', async () => {
    const result = await cacheWeatherData(testInput);

    // Query using proper drizzle syntax
    const cacheEntries = await db.select()
      .from(weatherCacheTable)
      .where(eq(weatherCacheTable.id, result.id))
      .execute();

    expect(cacheEntries).toHaveLength(1);
    expect(cacheEntries[0].city).toEqual('London');
    expect(cacheEntries[0].temperature).toEqual(15.5);
    expect(cacheEntries[0].precipitation).toEqual(2.3);
    expect(cacheEntries[0].weather_description).toEqual('Partly cloudy');
    expect(cacheEntries[0].date).toEqual('2024-01-15');
    expect(cacheEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different weather conditions correctly', async () => {
    const rainyWeather: CreateWeatherCacheInput = {
      city: 'Seattle',
      temperature: 8.2,
      precipitation: 15.7,
      weather_description: 'Heavy rain',
      date: '2024-01-16'
    };

    const result = await cacheWeatherData(rainyWeather);

    expect(result.city).toEqual('Seattle');
    expect(result.temperature).toEqual(8.2);
    expect(result.precipitation).toEqual(15.7);
    expect(result.weather_description).toEqual('Heavy rain');
    expect(result.date).toEqual('2024-01-16');
  });

  it('should handle zero precipitation correctly', async () => {
    const dryWeather: CreateWeatherCacheInput = {
      city: 'Phoenix',
      temperature: 32.1,
      precipitation: 0.0,
      weather_description: 'Clear sky',
      date: '2024-01-17'
    };

    const result = await cacheWeatherData(dryWeather);

    expect(result.precipitation).toEqual(0.0);
    expect(typeof result.precipitation).toBe('number');
  });

  it('should query cache entries by date range correctly', async () => {
    // Create multiple test entries
    await cacheWeatherData(testInput);
    
    const futureEntry: CreateWeatherCacheInput = {
      city: 'Paris',
      temperature: 12.0,
      precipitation: 1.5,
      weather_description: 'Light rain',
      date: '2024-01-20'
    };
    await cacheWeatherData(futureEntry);

    // Test date filtering - demonstration of correct date handling
    const today = new Date();

    // Proper query building - apply filter directly
    const cacheEntries = await db.select()
      .from(weatherCacheTable)
      .where(gte(weatherCacheTable.created_at, today))
      .execute();

    expect(cacheEntries.length).toBeGreaterThan(0);
    cacheEntries.forEach(entry => {
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.created_at >= today).toBe(true);
      expect(typeof entry.temperature).toBe('number');
      expect(typeof entry.precipitation).toBe('number');
    });
  });

  it('should handle multiple cache entries for same city with different dates', async () => {
    const day1Entry: CreateWeatherCacheInput = {
      city: 'Tokyo',
      temperature: 18.5,
      precipitation: 0.0,
      weather_description: 'Sunny',
      date: '2024-01-15'
    };

    const day2Entry: CreateWeatherCacheInput = {
      city: 'Tokyo',
      temperature: 16.2,
      precipitation: 3.1,
      weather_description: 'Rainy',
      date: '2024-01-16'
    };

    const result1 = await cacheWeatherData(day1Entry);
    const result2 = await cacheWeatherData(day2Entry);

    // Verify both entries are saved correctly
    expect(result1.city).toEqual('Tokyo');
    expect(result1.date).toEqual('2024-01-15');
    expect(result1.temperature).toEqual(18.5);

    expect(result2.city).toEqual('Tokyo');
    expect(result2.date).toEqual('2024-01-16');
    expect(result2.temperature).toEqual(16.2);

    // Query for Tokyo entries
    const tokyoEntries = await db.select()
      .from(weatherCacheTable)
      .where(eq(weatherCacheTable.city, 'Tokyo'))
      .execute();

    expect(tokyoEntries).toHaveLength(2);
  });
});
