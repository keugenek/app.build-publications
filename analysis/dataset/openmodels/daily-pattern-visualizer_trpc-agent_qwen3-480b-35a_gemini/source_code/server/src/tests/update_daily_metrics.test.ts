import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type UpdateDailyMetricsInput } from '../schema';
import { updateDailyMetrics } from '../handlers/update_daily_metrics';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

describe('updateDailyMetrics', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test record first using raw SQL to avoid type issues
    await db.execute(sql`
      INSERT INTO daily_metrics (date, sleep_duration, work_hours, social_time, screen_time, emotional_energy)
      VALUES ('2023-01-01', '8.5', '40.0', '10.0', '25.5', 7)
    `);
  });
  
  afterEach(resetDB);

  it('should update daily metrics partially', async () => {
    const updateInput: UpdateDailyMetricsInput = {
      id: 1,
      sleep_duration: 7.5,
      work_hours: 35.0,
      emotional_energy: 8
    };

    const result = await updateDailyMetrics(updateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-01-01'); // Should remain unchanged
    expect(result.sleep_duration).toEqual(7.5); // Updated value
    expect(result.work_hours).toEqual(35.0); // Updated value
    expect(result.social_time).toEqual(10.0); // Should remain unchanged
    expect(result.screen_time).toEqual(25.5); // Should remain unchanged
    expect(result.emotional_energy).toEqual(8); // Updated value
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated metrics to database', async () => {
    const updateInput: UpdateDailyMetricsInput = {
      id: 1,
      sleep_duration: 7.5,
      work_hours: 35.0,
      emotional_energy: 8
    };

    await updateDailyMetrics(updateInput);

    // Query using proper drizzle syntax
    const metrics = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, 1))
      .execute();

    expect(metrics).toHaveLength(1);
    expect(metrics[0].id).toEqual(1);
    // Handle date comparison - Drizzle returns date strings for date columns
    const dbDate = new Date(metrics[0].date);
    expect(dbDate.toISOString().split('T')[0]).toEqual('2023-01-01');
    expect(parseFloat(metrics[0].sleep_duration)).toEqual(7.5);
    expect(parseFloat(metrics[0].work_hours)).toEqual(35.0);
    expect(parseFloat(metrics[0].social_time)).toEqual(10.0);
    expect(parseFloat(metrics[0].screen_time)).toEqual(25.5);
    expect(metrics[0].emotional_energy).toEqual(8);
    expect(metrics[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when updating non-existent metrics', async () => {
    const invalidInput: UpdateDailyMetricsInput = {
      id: 999,
      sleep_duration: 6.0
    };

    await expect(updateDailyMetrics(invalidInput)).rejects.toThrow(/not found/i);
  });

  it('should handle updating all fields', async () => {
    const fullUpdateInput: UpdateDailyMetricsInput = {
      id: 1,
      date: new Date('2023-01-02'),
      sleep_duration: 6.5,
      work_hours: 30.0,
      social_time: 15.0,
      screen_time: 20.0,
      emotional_energy: 9
    };

    const result = await updateDailyMetrics(fullUpdateInput);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-01-02');
    expect(result.sleep_duration).toEqual(6.5);
    expect(result.work_hours).toEqual(30.0);
    expect(result.social_time).toEqual(15.0);
    expect(result.screen_time).toEqual(20.0);
    expect(result.emotional_energy).toEqual(9);
  });

  it('should handle numeric conversions correctly', async () => {
    const numericUpdateInput: UpdateDailyMetricsInput = {
      id: 1,
      sleep_duration: 0.0, // Test zero value
      work_hours: 0.5, // Test decimal value
      screen_time: 100.99 // Test precise decimal
    };

    const result = await updateDailyMetrics(numericUpdateInput);

    expect(typeof result.sleep_duration).toBe('number');
    expect(result.sleep_duration).toBeCloseTo(0.0);
    expect(typeof result.work_hours).toBe('number');
    expect(result.work_hours).toBeCloseTo(0.5);
    expect(typeof result.screen_time).toBe('number');
    expect(result.screen_time).toBeCloseTo(100.99);
  });
});
