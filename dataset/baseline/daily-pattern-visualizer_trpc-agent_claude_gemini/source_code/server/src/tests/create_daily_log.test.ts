import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput } from '../schema';
import { createDailyLog } from '../handlers/create_daily_log';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateDailyLogInput = {
  date: '2024-01-15',
  sleep_duration: 8.5,
  work_hours: 9.0,
  social_time: 2.5,
  screen_time: 4.0,
  emotional_energy: 7
};

describe('createDailyLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new daily log', async () => {
    const result = await createDailyLog(testInput);

    // Verify all fields are correctly set
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.sleep_duration).toEqual(8.5);
    expect(result.work_hours).toEqual(9.0);
    expect(result.social_time).toEqual(2.5);
    expect(result.screen_time).toEqual(4.0);
    expect(result.emotional_energy).toEqual(7);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save daily log to database', async () => {
    const result = await createDailyLog(testInput);

    // Query the database to verify the record was saved
    const savedLogs = await db.select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.id, result.id))
      .execute();

    expect(savedLogs).toHaveLength(1);
    const savedLog = savedLogs[0];
    expect(savedLog.date).toEqual('2024-01-15'); // Date stored as string in DB
    expect(savedLog.sleep_duration).toEqual(8.5);
    expect(savedLog.work_hours).toEqual(9.0);
    expect(savedLog.social_time).toEqual(2.5);
    expect(savedLog.screen_time).toEqual(4.0);
    expect(savedLog.emotional_energy).toEqual(7);
    expect(savedLog.created_at).toBeInstanceOf(Date);
    expect(savedLog.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing log for same date (upsert behavior)', async () => {
    // Create initial log
    const firstResult = await createDailyLog(testInput);
    
    // Create another log for the same date with different values
    const updatedInput: CreateDailyLogInput = {
      ...testInput,
      sleep_duration: 7.0,
      work_hours: 8.0,
      emotional_energy: 9
    };
    
    const secondResult = await createDailyLog(updatedInput);

    // Should have the same ID (updated, not created new)
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.date).toEqual(new Date('2024-01-15'));
    expect(secondResult.sleep_duration).toEqual(7.0);
    expect(secondResult.work_hours).toEqual(8.0);
    expect(secondResult.emotional_energy).toEqual(9);
    
    // Updated_at should be newer than created_at
    expect(secondResult.updated_at.getTime()).toBeGreaterThan(secondResult.created_at.getTime());
    
    // Verify only one record exists in database
    const allLogs = await db.select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.date, '2024-01-15'))
      .execute();
    
    expect(allLogs).toHaveLength(1);
    expect(allLogs[0].sleep_duration).toEqual(7.0);
    expect(allLogs[0].work_hours).toEqual(8.0);
    expect(allLogs[0].emotional_energy).toEqual(9);
  });

  it('should handle boundary values correctly', async () => {
    const boundaryInput: CreateDailyLogInput = {
      date: '2024-12-31',
      sleep_duration: 0, // Minimum sleep
      work_hours: 24, // Maximum work hours
      social_time: 0, // Minimum social time
      screen_time: 24, // Maximum screen time
      emotional_energy: 1 // Minimum emotional energy
    };

    const result = await createDailyLog(boundaryInput);

    expect(result.sleep_duration).toEqual(0);
    expect(result.work_hours).toEqual(24);
    expect(result.social_time).toEqual(0);
    expect(result.screen_time).toEqual(24);
    expect(result.emotional_energy).toEqual(1);
  });

  it('should handle maximum boundary values correctly', async () => {
    const maxBoundaryInput: CreateDailyLogInput = {
      date: '2024-06-15',
      sleep_duration: 24, // Maximum sleep
      work_hours: 0, // Minimum work hours
      social_time: 24, // Maximum social time
      screen_time: 0, // Minimum screen time
      emotional_energy: 10 // Maximum emotional energy
    };

    const result = await createDailyLog(maxBoundaryInput);

    expect(result.sleep_duration).toEqual(24);
    expect(result.work_hours).toEqual(0);
    expect(result.social_time).toEqual(24);
    expect(result.screen_time).toEqual(0);
    expect(result.emotional_energy).toEqual(10);
  });

  it('should handle fractional values correctly', async () => {
    const fractionalInput: CreateDailyLogInput = {
      date: '2024-03-20',
      sleep_duration: 7.25, // 7 hours 15 minutes
      work_hours: 8.75, // 8 hours 45 minutes
      social_time: 1.5, // 1 hour 30 minutes
      screen_time: 3.33, // 3 hours 20 minutes approximately
      emotional_energy: 6
    };

    const result = await createDailyLog(fractionalInput);

    expect(result.sleep_duration).toEqual(7.25);
    expect(result.work_hours).toEqual(8.75);
    expect(result.social_time).toEqual(1.5);
    expect(result.screen_time).toEqual(3.33);
    expect(result.emotional_energy).toEqual(6);
  });

  it('should create multiple logs for different dates', async () => {
    const input1: CreateDailyLogInput = {
      ...testInput,
      date: '2024-01-10'
    };
    
    const input2: CreateDailyLogInput = {
      ...testInput,
      date: '2024-01-11',
      sleep_duration: 9.0,
      emotional_energy: 8
    };

    const result1 = await createDailyLog(input1);
    const result2 = await createDailyLog(input2);

    // Should have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.date).toEqual(new Date('2024-01-10'));
    expect(result2.date).toEqual(new Date('2024-01-11'));
    expect(result2.sleep_duration).toEqual(9.0);
    expect(result2.emotional_energy).toEqual(8);

    // Verify both records exist in database
    const allLogs = await db.select()
      .from(dailyLogsTable)
      .execute();
    
    expect(allLogs).toHaveLength(2);
  });
});
