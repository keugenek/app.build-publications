import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type UpdateDailyLogInput } from '../schema';
import { updateDailyLog } from '../handlers/update_daily_log';
import { eq } from 'drizzle-orm';

// Helper function to create a test daily log
const createTestLog = async () => {
  const result = await db.insert(dailyLogsTable)
    .values({
      date: '2024-01-15',
      sleep_duration: 8.0,
      work_hours: 8.0,
      social_time: 2.0,
      screen_time: 6.0,
      emotional_energy: 7
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateDailyLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a daily log', async () => {
    // Create initial log
    const initialLog = await createTestLog();

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      date: '2024-01-16',
      sleep_duration: 7.5,
      work_hours: 9.0,
      social_time: 3.0,
      screen_time: 4.5,
      emotional_energy: 8
    };

    const result = await updateDailyLog(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(initialLog.id);
    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.sleep_duration).toEqual(7.5);
    expect(result.work_hours).toEqual(9.0);
    expect(result.social_time).toEqual(3.0);
    expect(result.screen_time).toEqual(4.5);
    expect(result.emotional_energy).toEqual(8);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(initialLog.created_at);
  });

  it('should update only specified fields (partial update)', async () => {
    // Create initial log
    const initialLog = await createTestLog();

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      sleep_duration: 9.0,
      emotional_energy: 9
    };

    const result = await updateDailyLog(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(initialLog.id);
    expect(result.date).toEqual(new Date(initialLog.date));
    expect(result.sleep_duration).toEqual(9.0);
    expect(result.work_hours).toEqual(8.0); // Unchanged
    expect(result.social_time).toEqual(2.0); // Unchanged
    expect(result.screen_time).toEqual(6.0); // Unchanged
    expect(result.emotional_energy).toEqual(9);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the database record', async () => {
    // Create initial log
    const initialLog = await createTestLog();

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      sleep_duration: 6.5,
      work_hours: 10.0
    };

    await updateDailyLog(updateInput);

    // Query database directly to verify update
    const updatedLogInDb = await db.select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.id, initialLog.id))
      .execute();

    expect(updatedLogInDb).toHaveLength(1);
    expect(Number(updatedLogInDb[0].sleep_duration)).toEqual(6.5);
    expect(Number(updatedLogInDb[0].work_hours)).toEqual(10.0);
    expect(Number(updatedLogInDb[0].social_time)).toEqual(2.0); // Unchanged
    expect(updatedLogInDb[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create initial log
    const initialLog = await createTestLog();
    const originalUpdatedAt = initialLog.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      emotional_energy: 6
    };

    const result = await updateDailyLog(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when daily log does not exist', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdateDailyLogInput = {
      id: nonExistentId,
      sleep_duration: 8.0
    };

    await expect(updateDailyLog(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric type conversions correctly', async () => {
    // Create initial log
    const initialLog = await createTestLog();

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      sleep_duration: 7.25,
      work_hours: 8.75,
      social_time: 1.5,
      screen_time: 5.25
    };

    const result = await updateDailyLog(updateInput);

    // Verify decimal values are handled correctly
    expect(typeof result.sleep_duration).toBe('number');
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.social_time).toBe('number');
    expect(typeof result.screen_time).toBe('number');
    expect(result.sleep_duration).toEqual(7.25);
    expect(result.work_hours).toEqual(8.75);
    expect(result.social_time).toEqual(1.5);
    expect(result.screen_time).toEqual(5.25);
  });

  it('should handle date updates correctly', async () => {
    // Create initial log
    const initialLog = await createTestLog();

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      date: '2024-02-20'
    };

    const result = await updateDailyLog(updateInput);

    // Verify date conversion
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-02-20');
  });

  it('should preserve created_at when updating', async () => {
    // Create initial log
    const initialLog = await createTestLog();

    const updateInput: UpdateDailyLogInput = {
      id: initialLog.id,
      sleep_duration: 9.0
    };

    const result = await updateDailyLog(updateInput);

    // Verify created_at is preserved
    expect(result.created_at).toEqual(initialLog.created_at);
  });
});
