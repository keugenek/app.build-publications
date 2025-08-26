import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type GetMetricsByDateInput } from '../schema';
import { getDailyMetricsByDate } from '../handlers/get_daily_metrics_by_date';
import { eq } from 'drizzle-orm';

// Test input for querying metrics
const testQueryInput: GetMetricsByDateInput = {
  date: '2024-01-15'
};

// Test data for creating daily metrics (using proper numeric types for insert)
const testMetricsData = {
  date: '2024-01-15',
  sleep_duration: 8.5,  // Number for insert
  work_hours: 6.25,     // Number for insert
  social_interaction_time: 3.0,  // Number for insert
  screen_time: 4.75,    // Number for insert
  emotional_energy_level: 7,  // Integer column
  notes: 'Good productive day with proper rest'
};

describe('getDailyMetricsByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily metrics for existing date', async () => {
    // Create test data
    await db.insert(dailyMetricsTable)
      .values(testMetricsData)
      .execute();

    const result = await getDailyMetricsByDate(testQueryInput);

    // Verify metrics are returned with correct data types
    expect(result).not.toBeNull();
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result!.sleep_duration).toEqual(8.5);
    expect(typeof result!.sleep_duration).toEqual('number');
    expect(result!.work_hours).toEqual(6.25);
    expect(typeof result!.work_hours).toEqual('number');
    expect(result!.social_interaction_time).toEqual(3.0);
    expect(typeof result!.social_interaction_time).toEqual('number');
    expect(result!.screen_time).toEqual(4.75);
    expect(typeof result!.screen_time).toEqual('number');
    expect(result!.emotional_energy_level).toEqual(7);
    expect(result!.notes).toEqual('Good productive day with proper rest');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no metrics exist for date', async () => {
    const result = await getDailyMetricsByDate(testQueryInput);

    expect(result).toBeNull();
  });

  it('should handle different dates correctly', async () => {
    // Create metrics for multiple dates
    await db.insert(dailyMetricsTable)
      .values([
        {
          ...testMetricsData,
          date: '2024-01-15'
        },
        {
          ...testMetricsData,
          date: '2024-01-16',
          sleep_duration: 7.0,
          work_hours: 8.0
        }
      ])
      .execute();

    // Query for specific date
    const result1 = await getDailyMetricsByDate({ date: '2024-01-15' });
    const result2 = await getDailyMetricsByDate({ date: '2024-01-16' });
    const result3 = await getDailyMetricsByDate({ date: '2024-01-17' });

    // Verify correct data is returned for each date
    expect(result1).not.toBeNull();
    expect(result1!.date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result1!.sleep_duration).toEqual(8.5);

    expect(result2).not.toBeNull();
    expect(result2!.date.toISOString().split('T')[0]).toEqual('2024-01-16');
    expect(result2!.sleep_duration).toEqual(7.0);
    expect(result2!.work_hours).toEqual(8.0);

    expect(result3).toBeNull();
  });

  it('should handle metrics with null notes correctly', async () => {
    // Create metrics without notes
    await db.insert(dailyMetricsTable)
      .values({
        ...testMetricsData,
        notes: null
      })
      .execute();

    const result = await getDailyMetricsByDate(testQueryInput);

    expect(result).not.toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.sleep_duration).toEqual(8.5);
    expect(typeof result!.sleep_duration).toEqual('number');
  });

  it('should verify data exists in database after query', async () => {
    // Create test data
    const insertResult = await db.insert(dailyMetricsTable)
      .values(testMetricsData)
      .returning()
      .execute();

    const result = await getDailyMetricsByDate(testQueryInput);

    // Verify data exists in database
    const dbMetrics = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, insertResult[0].id))
      .execute();

    expect(dbMetrics).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.date.toISOString().split('T')[0]).toEqual(dbMetrics[0].date);
  });

  it('should handle edge case numeric values correctly', async () => {
    // Create metrics with edge case values
    await db.insert(dailyMetricsTable)
      .values({
        date: '2024-01-15',
        sleep_duration: 0.0,    // Minimum sleep
        work_hours: 24.0,       // Maximum work hours
        social_interaction_time: 0.5,  // Minimal interaction
        screen_time: 23.75,     // High screen time
        emotional_energy_level: 1,  // Minimum energy
        notes: null
      })
      .execute();

    const result = await getDailyMetricsByDate(testQueryInput);

    expect(result).not.toBeNull();
    expect(result!.sleep_duration).toEqual(0.0);
    expect(result!.work_hours).toEqual(24.0);
    expect(result!.social_interaction_time).toEqual(0.5);
    expect(result!.screen_time).toEqual(23.75);
    expect(result!.emotional_energy_level).toEqual(1);
    
    // Verify all are proper numbers
    expect(typeof result!.sleep_duration).toEqual('number');
    expect(typeof result!.work_hours).toEqual('number');
    expect(typeof result!.social_interaction_time).toEqual('number');
    expect(typeof result!.screen_time).toEqual('number');
  });
});
