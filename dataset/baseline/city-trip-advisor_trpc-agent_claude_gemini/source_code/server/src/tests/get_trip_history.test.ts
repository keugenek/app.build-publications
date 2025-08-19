import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripHistoryTable } from '../db/schema';
import { getTripHistory } from '../handlers/get_trip_history';

describe('getTripHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no trip history exists', async () => {
    const result = await getTripHistory();
    
    expect(result).toBeArray();
    expect(result).toHaveLength(0);
  });

  it('should return single trip history record', async () => {
    // Create test trip history record
    const testDate = new Date('2024-01-15T12:00:00Z');
    await db.insert(tripHistoryTable)
      .values({
        city: 'Paris',
        is_good_idea: true,
        max_temperature: 22.5,
        precipitation: 0.0,
        weather_description: 'Sunny',
        forecast_date: testDate
      })
      .execute();

    const result = await getTripHistory();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      city: 'Paris',
      is_good_idea: true,
      max_temperature: 22.5,
      precipitation: 0.0,
      weather_description: 'Sunny'
    });
    expect(result[0].forecast_date).toBeInstanceOf(Date);
    expect(result[0].forecast_date).toEqual(testDate);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('number');
  });

  it('should return multiple trip history records ordered by creation date (newest first)', async () => {
    // Create multiple test records with different creation times
    const firstDate = new Date('2024-01-10T10:00:00Z');
    const secondDate = new Date('2024-01-15T15:00:00Z');
    const thirdDate = new Date('2024-01-20T20:00:00Z');

    // Insert records in non-chronological order to test ordering
    const [record2] = await db.insert(tripHistoryTable)
      .values({
        city: 'London',
        is_good_idea: false,
        max_temperature: 15.0,
        precipitation: 5.2,
        weather_description: 'Rainy',
        forecast_date: secondDate
      })
      .returning()
      .execute();

    // Simulate time passing by adding a small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    const [record1] = await db.insert(tripHistoryTable)
      .values({
        city: 'Tokyo',
        is_good_idea: true,
        max_temperature: 28.3,
        precipitation: 0.1,
        weather_description: 'Mostly Sunny',
        forecast_date: firstDate
      })
      .returning()
      .execute();

    // Another small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    const [record3] = await db.insert(tripHistoryTable)
      .values({
        city: 'Berlin',
        is_good_idea: true,
        max_temperature: 18.7,
        precipitation: 2.3,
        weather_description: 'Partly Cloudy',
        forecast_date: thirdDate
      })
      .returning()
      .execute();

    const result = await getTripHistory();

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at desc (newest first)
    expect(result[0].city).toBe('Berlin');
    expect(result[1].city).toBe('Tokyo');
    expect(result[2].city).toBe('London');
    
    // Verify creation order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle records with different weather conditions correctly', async () => {
    const testCases = [
      {
        city: 'Dubai',
        is_good_idea: false,
        max_temperature: 45.8,
        precipitation: 0.0,
        weather_description: 'Extremely Hot',
        forecast_date: new Date('2024-07-15T12:00:00Z')
      },
      {
        city: 'Reykjavik',
        is_good_idea: true,
        max_temperature: -5.2,
        precipitation: 15.7,
        weather_description: 'Snowy',
        forecast_date: new Date('2024-12-20T12:00:00Z')
      },
      {
        city: 'Mumbai',
        is_good_idea: false,
        max_temperature: 32.1,
        precipitation: 125.5,
        weather_description: 'Heavy Rain',
        forecast_date: new Date('2024-08-10T12:00:00Z')
      }
    ];

    // Insert all test cases
    for (const testCase of testCases) {
      await db.insert(tripHistoryTable)
        .values(testCase)
        .execute();
      // Small delay to ensure different created_at timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getTripHistory();

    expect(result).toHaveLength(3);
    
    // Verify all data types are correct
    result.forEach(record => {
      expect(typeof record.city).toBe('string');
      expect(typeof record.is_good_idea).toBe('boolean');
      expect(typeof record.max_temperature).toBe('number');
      expect(typeof record.precipitation).toBe('number');
      expect(typeof record.weather_description).toBe('string');
      expect(record.forecast_date).toBeInstanceOf(Date);
      expect(record.created_at).toBeInstanceOf(Date);
      expect(typeof record.id).toBe('number');
    });

    // Verify specific values are preserved correctly
    const dubaiRecord = result.find(r => r.city === 'Dubai');
    const reykjavikRecord = result.find(r => r.city === 'Reykjavik');
    const mumbaiRecord = result.find(r => r.city === 'Mumbai');

    expect(dubaiRecord).toBeDefined();
    expect(dubaiRecord!.max_temperature).toBe(45.8);
    expect(dubaiRecord!.precipitation).toBe(0.0);
    expect(dubaiRecord!.is_good_idea).toBe(false);

    expect(reykjavikRecord).toBeDefined();
    expect(reykjavikRecord!.max_temperature).toBe(-5.2);
    expect(reykjavikRecord!.precipitation).toBe(15.7);
    expect(reykjavikRecord!.is_good_idea).toBe(true);

    expect(mumbaiRecord).toBeDefined();
    expect(mumbaiRecord!.max_temperature).toBe(32.1);
    expect(mumbaiRecord!.precipitation).toBe(125.5);
    expect(mumbaiRecord!.is_good_idea).toBe(false);
  });

  it('should maintain precision for temperature and precipitation values', async () => {
    // Test with various decimal precision values
    const precisionTestCases = [
      { temp: 20.12345, precip: 1.98765 },
      { temp: 0.1, precip: 0.01 },
      { temp: 100.999, precip: 999.001 },
      { temp: -10.5, precip: 0.0 }
    ];

    for (let i = 0; i < precisionTestCases.length; i++) {
      const testCase = precisionTestCases[i];
      await db.insert(tripHistoryTable)
        .values({
          city: `TestCity${i}`,
          is_good_idea: true,
          max_temperature: testCase.temp,
          precipitation: testCase.precip,
          weather_description: 'Test Weather',
          forecast_date: new Date(`2024-0${i + 1}-01T12:00:00Z`)
        })
        .execute();
    }

    const result = await getTripHistory();

    expect(result).toHaveLength(4);

    // Verify precision is maintained (within floating point tolerance)
    result.forEach((record, index) => {
      const originalData = precisionTestCases[precisionTestCases.length - 1 - index]; // Reverse order due to DESC ordering
      expect(record.max_temperature).toBeCloseTo(originalData.temp, 5);
      expect(record.precipitation).toBeCloseTo(originalData.precip, 5);
    });
  });
});
