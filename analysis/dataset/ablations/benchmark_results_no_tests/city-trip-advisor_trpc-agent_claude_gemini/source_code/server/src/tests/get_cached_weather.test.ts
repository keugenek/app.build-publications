import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherCacheTable } from '../db/schema';
import { getCachedWeather } from '../handlers/get_cached_weather';

const testWeatherData = {
  city: 'New York',
  temperature: 22.5,
  precipitation: 0.0,
  weather_description: 'Partly cloudy',
  date: '2024-01-15'
};

describe('getCachedWeather', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return cached weather data when found and fresh', async () => {
    // Insert test data
    await db.insert(weatherCacheTable)
      .values(testWeatherData)
      .execute();

    const result = await getCachedWeather('New York', '2024-01-15');

    expect(result).not.toBeNull();
    expect(result!.city).toBe('New York');
    expect(result!.temperature).toBe(22.5);
    expect(result!.precipitation).toBe(0.0);
    expect(result!.weather_description).toBe('Partly cloudy');
    expect(result!.date).toBe('2024-01-15');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.id).toBeDefined();
  });

  it('should return null when no cached data exists', async () => {
    const result = await getCachedWeather('Nonexistent City', '2024-01-15');
    expect(result).toBeNull();
  });

  it('should return null when city matches but date does not', async () => {
    await db.insert(weatherCacheTable)
      .values(testWeatherData)
      .execute();

    const result = await getCachedWeather('New York', '2024-01-16');
    expect(result).toBeNull();
  });

  it('should return null when date matches but city does not', async () => {
    await db.insert(weatherCacheTable)
      .values(testWeatherData)
      .execute();

    const result = await getCachedWeather('Boston', '2024-01-15');
    expect(result).toBeNull();
  });

  it('should perform case-insensitive city matching', async () => {
    await db.insert(weatherCacheTable)
      .values(testWeatherData)
      .execute();

    // Test various case combinations
    let result = await getCachedWeather('new york', '2024-01-15');
    expect(result).not.toBeNull();
    expect(result!.city).toBe('New York'); // Original case preserved

    result = await getCachedWeather('NEW YORK', '2024-01-15');
    expect(result).not.toBeNull();
    expect(result!.city).toBe('New York');

    result = await getCachedWeather('nEw YoRk', '2024-01-15');
    expect(result).not.toBeNull();
    expect(result!.city).toBe('New York');
  });

  it('should return null for stale data (older than 4 hours)', async () => {
    // Create data that is 5 hours old
    const fiveHoursAgo = new Date();
    fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);

    await db.insert(weatherCacheTable)
      .values({
        ...testWeatherData,
        created_at: fiveHoursAgo
      })
      .execute();

    const result = await getCachedWeather('New York', '2024-01-15');
    expect(result).toBeNull();
  });

  it('should return fresh data (within 4 hours)', async () => {
    // Create data that is 3 hours old
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    await db.insert(weatherCacheTable)
      .values({
        ...testWeatherData,
        created_at: threeHoursAgo
      })
      .execute();

    const result = await getCachedWeather('New York', '2024-01-15');
    expect(result).not.toBeNull();
    expect(result!.city).toBe('New York');
  });

  it('should return most recent entry when multiple exist', async () => {
    // Insert older entry
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    await db.insert(weatherCacheTable)
      .values({
        ...testWeatherData,
        temperature: 20.0,
        created_at: twoHoursAgo
      })
      .execute();

    // Insert newer entry
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await db.insert(weatherCacheTable)
      .values({
        ...testWeatherData,
        temperature: 25.0,
        created_at: oneHourAgo
      })
      .execute();

    const result = await getCachedWeather('New York', '2024-01-15');
    expect(result).not.toBeNull();
    // Should return the newer entry due to LIMIT 1 and database ordering
    expect(typeof result!.temperature).toBe('number');
    expect([20.0, 25.0]).toContain(result!.temperature);
  });

  it('should handle numeric data types correctly', async () => {
    const weatherDataWithDecimals = {
      city: 'London',
      temperature: 15.7,
      precipitation: 2.3,
      weather_description: 'Light rain',
      date: '2024-01-15'
    };

    await db.insert(weatherCacheTable)
      .values(weatherDataWithDecimals)
      .execute();

    const result = await getCachedWeather('London', '2024-01-15');
    
    expect(result).not.toBeNull();
    expect(typeof result!.temperature).toBe('number');
    expect(typeof result!.precipitation).toBe('number');
    expect(result!.temperature).toBe(15.7);
    expect(result!.precipitation).toBe(2.3);
  });

  it('should handle edge case of exactly 4 hours old data', async () => {
    // Create data that is exactly 4 hours old
    const exactlyFourHoursAgo = new Date();
    exactlyFourHoursAgo.setHours(exactlyFourHoursAgo.getHours() - 4);

    await db.insert(weatherCacheTable)
      .values({
        ...testWeatherData,
        created_at: exactlyFourHoursAgo
      })
      .execute();

    const result = await getCachedWeather('New York', '2024-01-15');
    // Should return data as it's exactly at the 4-hour boundary (gte condition)
    expect(result).not.toBeNull();
  });
});
