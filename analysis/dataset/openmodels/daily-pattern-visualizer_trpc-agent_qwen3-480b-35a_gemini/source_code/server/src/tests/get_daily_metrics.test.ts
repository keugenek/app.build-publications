import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { getDailyMetrics } from '../handlers/get_daily_metrics';

describe('getDailyMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no metrics exist', async () => {
    const result = await getDailyMetrics();
    expect(result).toEqual([]);
  });

  it('should return all daily metrics', async () => {
    // Insert test data
    const testMetrics = [
      {
        date: '2023-01-01',
        sleep_duration: '7.50',
        work_hours: '8.00',
        social_time: '2.00',
        screen_time: '4.50',
        emotional_energy: 8
      },
      {
        date: '2023-01-02',
        sleep_duration: '6.00',
        work_hours: '9.00',
        social_time: '1.50',
        screen_time: '6.00',
        emotional_energy: 6
      }
    ];

    await db.insert(dailyMetricsTable).values(testMetrics).execute();

    // Test the handler
    const result = await getDailyMetrics();

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first metric
    expect(result[0].id).toBeDefined();
    expect(result[0].date).toEqual(new Date('2023-01-01'));
    expect(result[0].sleep_duration).toBe(7.5);
    expect(result[0].work_hours).toBe(8);
    expect(result[0].social_time).toBe(2);
    expect(result[0].screen_time).toBe(4.5);
    expect(result[0].emotional_energy).toBe(8);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check second metric
    expect(result[1].id).toBeDefined();
    expect(result[1].date).toEqual(new Date('2023-01-02'));
    expect(result[1].sleep_duration).toBe(6);
    expect(result[1].work_hours).toBe(9);
    expect(result[1].social_time).toBe(1.5);
    expect(result[1].screen_time).toBe(6);
    expect(result[1].emotional_energy).toBe(6);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric conversions correctly', async () => {
    // Insert test data with precise decimal values
    const testMetric = {
      date: '2023-01-01',
      sleep_duration: '7.25',
      work_hours: '8.75',
      social_time: '1.25',
      screen_time: '5.50',
      emotional_energy: 7
    };

    await db.insert(dailyMetricsTable).values(testMetric).execute();

    // Test the handler
    const result = await getDailyMetrics();

    expect(result).toHaveLength(1);
    expect(result[0].sleep_duration).toBe(7.25);
    expect(result[0].work_hours).toBe(8.75);
    expect(result[0].social_time).toBe(1.25);
    expect(result[0].screen_time).toBe(5.5);
    expect(typeof result[0].sleep_duration).toBe('number');
    expect(typeof result[0].work_hours).toBe('number');
    expect(typeof result[0].social_time).toBe('number');
    expect(typeof result[0].screen_time).toBe('number');
  });
});
