import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput } from '../schema';
import { createDailyLog } from '../handlers/create_daily_log';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateDailyLogInput = {
  date: new Date('2023-12-01'),
  sleep_hours: 7.5,
  work_hours: 8.0,
  social_time: 2.5,
  screen_time: 6.0,
  emotional_energy: 7
};

describe('createDailyLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a daily log entry', async () => {
    const result = await createDailyLog(testInput);

    // Basic field validation
    expect(result.date).toEqual(testInput.date);
    expect(result.sleep_hours).toEqual(7.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_time).toEqual(2.5);
    expect(result.screen_time).toEqual(6.0);
    expect(result.emotional_energy).toEqual(7);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save daily log to database', async () => {
    const result = await createDailyLog(testInput);

    // Query using proper drizzle syntax
    const logs = await db.select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.id, result.id))
      .execute();

    expect(logs).toHaveLength(1);
    expect(new Date(logs[0].date)).toEqual(testInput.date);
    expect(parseFloat(logs[0].sleep_hours)).toEqual(7.5);
    expect(parseFloat(logs[0].work_hours)).toEqual(8.0);
    expect(parseFloat(logs[0].social_time)).toEqual(2.5);
    expect(parseFloat(logs[0].screen_time)).toEqual(6.0);
    expect(parseFloat(logs[0].emotional_energy)).toEqual(7);
    expect(logs[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle fractional values correctly', async () => {
    const fractionalInput: CreateDailyLogInput = {
      date: new Date('2023-12-02'),
      sleep_hours: 6.75,
      work_hours: 7.25,
      social_time: 1.5,
      screen_time: 4.33,
      emotional_energy: 8
    };

    const result = await createDailyLog(fractionalInput);

    expect(result.sleep_hours).toBeCloseTo(6.75);
    expect(result.work_hours).toBeCloseTo(7.25);
    expect(result.social_time).toBeCloseTo(1.5);
    expect(result.screen_time).toBeCloseTo(4.33);
    expect(result.emotional_energy).toEqual(8);
  });
});
