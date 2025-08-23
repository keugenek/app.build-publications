import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';
import { type PomodoroLog } from '../schema';
import { getPomodoroLogs } from '../handlers/get_pomodoro_logs';
import { eq } from 'drizzle-orm';

describe('getPomodoroLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no logs exist', async () => {
    const logs = await getPomodoroLogs();
    expect(Array.isArray(logs)).toBeTrue();
    expect(logs).toHaveLength(0);
  });

  it('should retrieve inserted pomodoro log entries', async () => {
    // Insert a log entry directly via DB
    const insertResult = await db.insert(pomodoroLogTable)
      .values({
        work_duration: 25,
        break_duration: 5,
      })
      .returning()
      .execute();

    const insertedLog = insertResult[0];
    expect(insertedLog).toBeDefined();
    // fetched logs
    const logs = await getPomodoroLogs();
    expect(logs).toHaveLength(1);
    const fetched = logs[0];
    // Verify fields match inserted data
    expect(fetched.id).toBe(insertedLog.id);
    expect(fetched.work_duration).toBe(25);
    expect(fetched.break_duration).toBe(5);
    expect(fetched.started_at).toBeInstanceOf(Date);
  });

  it('should return multiple log entries', async () => {
    // Insert two logs
    await db.insert(pomodoroLogTable).values([
      { work_duration: 30, break_duration: 10 },
      { work_duration: 20, break_duration: 5 },
    ]).execute();

    const logs = await getPomodoroLogs();
    expect(logs).toHaveLength(2);
    const durations = logs.map(l => l.work_duration).sort();
    expect(durations).toEqual([20, 30]);
  });
});
