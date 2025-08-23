import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { logsTable } from '../db/schema';
import { type Log } from '../schema';
import { getLogs } from '../handlers/get_logs';
import { eq } from 'drizzle-orm';

// Test input for a log entry
const testLog: Omit<Log, 'id' | 'created_at'> = {
  date: new Date('2023-01-01'),
  sleep_duration: 7.5,
  work_hours: 8,
  social_time: 2.5,
  screen_time: 3,
  emotional_energy: 8
};

describe('getLogs handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all logs with correct type conversions', async () => {
    // Insert a log directly into the database
    await db.insert(logsTable).values({
      date: testLog.date.toISOString().split('T')[0],
      sleep_duration: testLog.sleep_duration.toString(),
      work_hours: testLog.work_hours.toString(),
      social_time: testLog.social_time.toString(),
      screen_time: testLog.screen_time.toString(),
      emotional_energy: testLog.emotional_energy
    }).execute();

    const logs = await getLogs();
    expect(logs).toHaveLength(1);
    const result = logs[0];

    // Verify all fields are present and correctly typed
    expect(result.date).toEqual(testLog.date);
    expect(result.sleep_duration).toBe(7.5);
    expect(typeof result.sleep_duration).toBe('number');
    expect(result.work_hours).toBe(8);
    expect(typeof result.work_hours).toBe('number');
    expect(result.social_time).toBe(2.5);
    expect(typeof result.social_time).toBe('number');
    expect(result.screen_time).toBe(3);
    expect(typeof result.screen_time).toBe('number');
    expect(result.emotional_energy).toBe(8);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should fetch logs using a query filter', async () => {
    // Insert two logs with different dates
    await db.insert(logsTable).values({
      date: '2023-01-01',
      sleep_duration: '7',
      work_hours: '8',
      social_time: '2',
      screen_time: '3',
      emotional_energy: 7
    }).execute();
    await db.insert(logsTable).values({
      date: '2023-02-01',
      sleep_duration: '6',
      work_hours: '9',
      social_time: '1',
      screen_time: '4',
      emotional_energy: 9
    }).execute();

    // Direct query using drizzle to ensure logs exist
    const all = await db.select().from(logsTable).where(eq(logsTable.date, '2023-01-01')).execute();
    expect(all).toHaveLength(1);

    const logs = await getLogs();
    expect(logs).toHaveLength(2);
  });
});
