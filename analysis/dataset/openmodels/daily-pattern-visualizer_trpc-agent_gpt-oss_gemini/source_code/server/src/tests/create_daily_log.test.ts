import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput } from '../schema';
import { createDailyLog } from '../handlers/create_daily_log';
import { eq, gte, between, and } from 'drizzle-orm';

// Test input covering all fields
const testInput: CreateDailyLogInput = {
  logged_at: new Date('2025-01-01T08:00:00Z'),
  sleep_hours: 7.5,
  work_hours: 8,
  social_hours: 2,
  screen_hours: 3.5,
  emotional_energy: 8,
};

describe('createDailyLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a daily log entry', async () => {
    const result = await createDailyLog(testInput);

    expect(result.id).toBeDefined();
    expect(result.logged_at).toBeInstanceOf(Date);
    expect(result.logged_at.getTime()).toBe(testInput.logged_at.getTime());
    expect(result.sleep_hours).toBe(testInput.sleep_hours);
    expect(result.work_hours).toBe(testInput.work_hours);
    expect(result.social_hours).toBe(testInput.social_hours);
    expect(result.screen_hours).toBe(testInput.screen_hours);
    expect(result.emotional_energy).toBe(testInput.emotional_energy);
  });

  it('should persist the daily log in the database', async () => {
    const result = await createDailyLog(testInput);

    const logs = await db
      .select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.id, result.id))
      .execute();

    expect(logs).toHaveLength(1);
    const log = logs[0];
    expect(log.id).toBe(result.id);
    expect(log.logged_at).toBeInstanceOf(Date);
    expect(log.logged_at.getTime()).toBe(testInput.logged_at.getTime());
    expect(log.sleep_hours).toBe(testInput.sleep_hours);
    expect(log.work_hours).toBe(testInput.work_hours);
    expect(log.social_hours).toBe(testInput.social_hours);
    expect(log.screen_hours).toBe(testInput.screen_hours);
    expect(log.emotional_energy).toBe(testInput.emotional_energy);
  });

  it('should filter logs by date range correctly', async () => {
    // Insert a log
    await createDailyLog(testInput);

    const today = new Date('2025-01-01T00:00:00Z');
    const tomorrow = new Date('2025-01-02T00:00:00Z');

    const logs = await db
      .select()
      .from(dailyLogsTable)
      .where(
        and(
          gte(dailyLogsTable.logged_at, today),
          between(dailyLogsTable.logged_at, today, tomorrow)
        )
      )
      .execute();

    expect(logs.length).toBeGreaterThan(0);
    logs.forEach((log) => {
      expect(log.logged_at).toBeInstanceOf(Date);
      expect(log.logged_at.getTime()).toBeGreaterThanOrEqual(today.getTime());
      expect(log.logged_at.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
    });
  });
});
