import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripHistoryTable } from '../db/schema';
import { type CreateTripHistoryInput } from '../schema';
import { saveTripHistory } from '../handlers/save_trip_history';
import { eq } from 'drizzle-orm';

// Test input for a good trip idea
const goodTripInput: CreateTripHistoryInput = {
  city: 'New York',
  is_good_idea: true,
  max_temperature: 22.5,
  precipitation: 0.0,
  weather_description: 'Clear skies',
  forecast_date: '2024-06-15'
};

// Test input for a bad trip idea
const badTripInput: CreateTripHistoryInput = {
  city: 'Seattle',
  is_good_idea: false,
  max_temperature: 15.0,
  precipitation: 12.5,
  weather_description: 'Heavy rain',
  forecast_date: '2024-06-16'
};

describe('saveTripHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a good trip history record', async () => {
    const result = await saveTripHistory(goodTripInput);

    // Validate returned data structure
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.city).toEqual('New York');
    expect(result.is_good_idea).toBe(true);
    expect(result.max_temperature).toEqual(22.5);
    expect(typeof result.max_temperature).toBe('number');
    expect(result.precipitation).toEqual(0.0);
    expect(typeof result.precipitation).toBe('number');
    expect(result.weather_description).toEqual('Clear skies');
    expect(result.forecast_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify forecast_date conversion
    const expectedDate = new Date('2024-06-15');
    expect(result.forecast_date.getTime()).toEqual(expectedDate.getTime());
  });

  it('should save a bad trip history record', async () => {
    const result = await saveTripHistory(badTripInput);

    // Validate returned data structure
    expect(result.id).toBeDefined();
    expect(result.city).toEqual('Seattle');
    expect(result.is_good_idea).toBe(false);
    expect(result.max_temperature).toEqual(15.0);
    expect(result.precipitation).toEqual(12.5);
    expect(result.weather_description).toEqual('Heavy rain');
    expect(result.forecast_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist data to database correctly', async () => {
    const result = await saveTripHistory(goodTripInput);

    // Query database directly to verify persistence
    const records = await db.select()
      .from(tripHistoryTable)
      .where(eq(tripHistoryTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    const record = records[0];

    expect(record.id).toEqual(result.id);
    expect(record.city).toEqual('New York');
    expect(record.is_good_idea).toBe(true);
    expect(record.max_temperature).toEqual(22.5);
    expect(record.precipitation).toEqual(0.0);
    expect(record.weather_description).toEqual('Clear skies');
    expect(record.forecast_date).toBeInstanceOf(Date);
    expect(record.created_at).toBeInstanceOf(Date);
  });

  it('should handle different date formats correctly', async () => {
    const inputWithISODate: CreateTripHistoryInput = {
      ...goodTripInput,
      forecast_date: '2024-12-25T10:30:00Z'
    };

    const result = await saveTripHistory(inputWithISODate);

    expect(result.forecast_date).toBeInstanceOf(Date);
    expect(result.forecast_date.getFullYear()).toBe(2024);
    expect(result.forecast_date.getMonth()).toBe(11); // December is month 11
    expect(result.forecast_date.getDate()).toBe(25);
  });

  it('should handle zero precipitation correctly', async () => {
    const inputWithZeroPrecipitation: CreateTripHistoryInput = {
      ...goodTripInput,
      precipitation: 0
    };

    const result = await saveTripHistory(inputWithZeroPrecipitation);

    expect(result.precipitation).toBe(0);
    expect(typeof result.precipitation).toBe('number');

    // Verify in database
    const records = await db.select()
      .from(tripHistoryTable)
      .where(eq(tripHistoryTable.id, result.id))
      .execute();

    expect(records[0].precipitation).toBe(0);
  });

  it('should handle negative temperatures correctly', async () => {
    const inputWithNegativeTemp: CreateTripHistoryInput = {
      ...goodTripInput,
      city: 'Anchorage',
      max_temperature: -10.5,
      is_good_idea: false,
      weather_description: 'Freezing cold'
    };

    const result = await saveTripHistory(inputWithNegativeTemp);

    expect(result.max_temperature).toBe(-10.5);
    expect(typeof result.max_temperature).toBe('number');

    // Verify in database
    const records = await db.select()
      .from(tripHistoryTable)
      .where(eq(tripHistoryTable.id, result.id))
      .execute();

    expect(records[0].max_temperature).toBe(-10.5);
  });

  it('should set created_at timestamp automatically', async () => {
    const beforeSave = new Date();
    const result = await saveTripHistory(goodTripInput);
    const afterSave = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterSave.getTime());
  });

  it('should save multiple records independently', async () => {
    const result1 = await saveTripHistory(goodTripInput);
    const result2 = await saveTripHistory(badTripInput);

    // Should have different IDs
    expect(result1.id).not.toEqual(result2.id);

    // Should have different cities
    expect(result1.city).toEqual('New York');
    expect(result2.city).toEqual('Seattle');

    // Verify both exist in database
    const allRecords = await db.select().from(tripHistoryTable).execute();
    expect(allRecords).toHaveLength(2);

    const cities = allRecords.map(r => r.city);
    expect(cities).toContain('New York');
    expect(cities).toContain('Seattle');
  });

  it('should handle long weather descriptions', async () => {
    const longDescriptionInput: CreateTripHistoryInput = {
      ...goodTripInput,
      weather_description: 'Partly cloudy with occasional sunshine, light winds from the west, humidity at moderate levels, perfect for outdoor activities and sightseeing'
    };

    const result = await saveTripHistory(longDescriptionInput);

    expect(result.weather_description).toEqual(longDescriptionInput.weather_description);
    expect(result.weather_description.length).toBeGreaterThan(50);

    // Verify in database
    const records = await db.select()
      .from(tripHistoryTable)
      .where(eq(tripHistoryTable.id, result.id))
      .execute();

    expect(records[0].weather_description).toEqual(longDescriptionInput.weather_description);
  });
});
