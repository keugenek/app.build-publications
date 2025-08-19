import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type GetLogByDateInput } from '../schema';
import { getDailyLogByDate } from '../handlers/get_daily_log_by_date';

describe('getDailyLogByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testLogData = {
    date: '2024-01-15',
    sleep_duration: 7.5,
    work_hours: 8.0,
    social_time: 2.5,
    screen_time: 5.0,
    emotional_energy: 8
  };

  const testInput: GetLogByDateInput = {
    date: '2024-01-15'
  };

  it('should return daily log for existing date', async () => {
    // Create test log entry
    await db.insert(dailyLogsTable)
      .values({
        date: testLogData.date,
        sleep_duration: testLogData.sleep_duration,
        work_hours: testLogData.work_hours,
        social_time: testLogData.social_time,
        screen_time: testLogData.screen_time,
        emotional_energy: testLogData.emotional_energy
      })
      .execute();

    const result = await getDailyLogByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(result!.sleep_duration).toEqual(7.5);
    expect(result!.work_hours).toEqual(8.0);
    expect(result!.social_time).toEqual(2.5);
    expect(result!.screen_time).toEqual(5.0);
    expect(result!.emotional_energy).toEqual(8);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existing date', async () => {
    const nonExistingInput: GetLogByDateInput = {
      date: '2024-12-31'
    };

    const result = await getDailyLogByDate(nonExistingInput);

    expect(result).toBeNull();
  });

  it('should return correct numeric types for all fields', async () => {
    // Insert log with decimal values
    await db.insert(dailyLogsTable)
      .values({
        date: '2024-02-20',
        sleep_duration: 6.75,
        work_hours: 9.25,
        social_time: 1.5,
        screen_time: 4.25,
        emotional_energy: 5
      })
      .execute();

    const result = await getDailyLogByDate({ date: '2024-02-20' });

    expect(result).not.toBeNull();
    expect(typeof result!.sleep_duration).toBe('number');
    expect(typeof result!.work_hours).toBe('number');
    expect(typeof result!.social_time).toBe('number');
    expect(typeof result!.screen_time).toBe('number');
    expect(typeof result!.emotional_energy).toBe('number');
    
    // Verify exact decimal values are preserved
    expect(result!.sleep_duration).toEqual(6.75);
    expect(result!.work_hours).toEqual(9.25);
    expect(result!.social_time).toEqual(1.5);
    expect(result!.screen_time).toEqual(4.25);
  });

  it('should handle edge case values correctly', async () => {
    // Insert log with boundary values
    await db.insert(dailyLogsTable)
      .values({
        date: '2024-03-01',
        sleep_duration: 0,
        work_hours: 24,
        social_time: 0,
        screen_time: 24,
        emotional_energy: 1
      })
      .execute();

    const result = await getDailyLogByDate({ date: '2024-03-01' });

    expect(result).not.toBeNull();
    expect(result!.sleep_duration).toEqual(0);
    expect(result!.work_hours).toEqual(24);
    expect(result!.social_time).toEqual(0);
    expect(result!.screen_time).toEqual(24);
    expect(result!.emotional_energy).toEqual(1);
  });

  it('should return only one log when querying specific date', async () => {
    // Create multiple logs for different dates
    await db.insert(dailyLogsTable)
      .values([
        {
          date: '2024-01-10',
          sleep_duration: 7,
          work_hours: 8,
          social_time: 2,
          screen_time: 5,
          emotional_energy: 6
        },
        {
          date: '2024-01-15',
          sleep_duration: 8,
          work_hours: 7,
          social_time: 3,
          screen_time: 4,
          emotional_energy: 7
        },
        {
          date: '2024-01-20',
          sleep_duration: 6,
          work_hours: 9,
          social_time: 1,
          screen_time: 6,
          emotional_energy: 5
        }
      ])
      .execute();

    const result = await getDailyLogByDate({ date: '2024-01-15' });

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(result!.sleep_duration).toEqual(8);
    expect(result!.work_hours).toEqual(7);
    expect(result!.social_time).toEqual(3);
    expect(result!.screen_time).toEqual(4);
    expect(result!.emotional_energy).toEqual(7);
  });

  it('should handle different date formats in database', async () => {
    // Test various valid date string formats
    const testDates = ['2024-05-01', '2024-12-25'];
    
    for (const dateStr of testDates) {
      await db.insert(dailyLogsTable)
        .values({
          date: dateStr,
          sleep_duration: 7,
          work_hours: 8,
          social_time: 2,
          screen_time: 5,
          emotional_energy: 7
        })
        .execute();

      const result = await getDailyLogByDate({ date: dateStr });
      
      expect(result).not.toBeNull();
      expect(result!.date).toEqual(new Date(`${dateStr}T00:00:00.000Z`));
    }
  });
});
