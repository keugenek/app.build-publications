import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type CreateDailyMetricsInput } from '../schema';
import { createDailyMetrics } from '../handlers/create_daily_metrics';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateDailyMetricsInput = {
  date: new Date('2023-01-15'),
  sleep_duration: 7.5,
  work_hours: 8.0,
  social_time: 2.5,
  screen_time: 4.0,
  emotional_energy: 7
};

describe('createDailyMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create daily metrics', async () => {
    const result = await createDailyMetrics(testInput);

    // Basic field validation
    expect(result.date).toEqual(testInput.date);
    expect(result.sleep_duration).toEqual(7.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_time).toEqual(2.5);
    expect(result.screen_time).toEqual(4.0);
    expect(result.emotional_energy).toEqual(7);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save daily metrics to database', async () => {
    const result = await createDailyMetrics(testInput);

    // Query using proper drizzle syntax
    const metrics = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, result.id))
      .execute();

    expect(metrics).toHaveLength(1);
    expect(new Date(metrics[0].date)).toEqual(testInput.date);
    expect(parseFloat(metrics[0].sleep_duration)).toEqual(7.5);
    expect(parseFloat(metrics[0].work_hours)).toEqual(8.0);
    expect(parseFloat(metrics[0].social_time)).toEqual(2.5);
    expect(parseFloat(metrics[0].screen_time)).toEqual(4.0);
    expect(metrics[0].emotional_energy).toEqual(7);
    expect(metrics[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle zero values correctly', async () => {
    const zeroInput: CreateDailyMetricsInput = {
      date: new Date('2023-01-16'),
      sleep_duration: 0,
      work_hours: 0,
      social_time: 0,
      screen_time: 0,
      emotional_energy: 1
    };

    const result = await createDailyMetrics(zeroInput);

    expect(result.sleep_duration).toEqual(0);
    expect(result.work_hours).toEqual(0);
    expect(result.social_time).toEqual(0);
    expect(result.screen_time).toEqual(0);
    expect(result.emotional_energy).toEqual(1);
  });
});
