import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type CreateDailyMetricsInput } from '../schema';
import { createDailyMetrics } from '../handlers/create_daily_metrics';
import { eq } from 'drizzle-orm';

// Test input covering all fields
const testInput: CreateDailyMetricsInput = {
  date: new Date('2024-01-01'),
  sleep_duration: 7.5,
  work_hours: 8,
  social_time: 2.25,
  screen_time: 4.75,
  emotional_energy: 6,
};

describe('createDailyMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a daily metrics record and return correct types', async () => {
    const result = await createDailyMetrics(testInput);

    // Verify returned object fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.sleep_duration).toBeCloseTo(7.5);
    expect(result.work_hours).toBeCloseTo(8);
    expect(result.social_time).toBeCloseTo(2.25);
    expect(result.screen_time).toBeCloseTo(4.75);
    expect(result.emotional_energy).toBe(6);
  });

  it('should persist the record in the database with correct numeric conversion', async () => {
    const result = await createDailyMetrics(testInput);

    const rows = await db
      .select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    // Numeric columns are stored as strings; convert for comparison
    expect(parseFloat(row.sleep_duration)).toBeCloseTo(7.5);
    expect(parseFloat(row.work_hours)).toBeCloseTo(8);
    expect(parseFloat(row.social_time)).toBeCloseTo(2.25);
    expect(parseFloat(row.screen_time)).toBeCloseTo(4.75);
    expect(row.emotional_energy).toBe(6);
    expect(row.date).toBe('2024-01-01');
  });
});
