import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput } from '../schema';
import { getDailyLogs } from '../handlers/get_daily_logs';

// Sample input for creating a daily log entry
const sampleLog: CreateDailyLogInput = {
  logged_at: new Date('2023-01-01T08:00:00Z'),
  sleep_hours: 7.5,
  work_hours: 8,
  social_hours: 2,
  screen_hours: 4,
  emotional_energy: 8,
};

describe('getDailyLogs handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when there are no logs', async () => {
    const logs = await getDailyLogs();
    expect(logs).toBeInstanceOf(Array);
    expect(logs).toHaveLength(0);
  });

  it('should retrieve all daily logs from the database', async () => {
    // Insert two logs directly via DB
    const inserted = await db
      .insert(dailyLogsTable)
      .values([sampleLog, { ...sampleLog, logged_at: new Date('2023-01-02T08:00:00Z') }])
      .returning()
      .execute();

    // Ensure insertion worked
    expect(inserted).toHaveLength(2);

    // Use the handler to fetch logs
    const logs = await getDailyLogs();

    expect(logs).toBeInstanceOf(Array);
    expect(logs).toHaveLength(2);

    // Validate fields of the first returned log
    const first = logs.find(l => l.id === inserted[0].id);
    expect(first).toBeDefined();
    if (first) {
      expect(first.logged_at).toBeInstanceOf(Date);
      expect(first.sleep_hours).toBe(7.5);
      expect(first.work_hours).toBe(8);
      expect(first.social_hours).toBe(2);
      expect(first.screen_hours).toBe(4);
      expect(first.emotional_energy).toBe(8);
    }
  });
});
