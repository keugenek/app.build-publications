import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyConspiracyLevelsTable } from '../db/schema';
import { type GetDailyConspiracyLevelInput } from '../schema';
import { getDailyConspiracyLevel } from '../handlers/get_daily_conspiracy_level';

describe('getDailyConspiracyLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily conspiracy level for existing date', async () => {
    // Insert test data
    const testDate = new Date('2024-01-15');
    const testDateString = testDate.toISOString().split('T')[0]; // '2024-01-15'
    
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: testDateString,
        total_conspiracy_score: 75,
        activity_count: 10
      })
      .execute();

    // Test input
    const input: GetDailyConspiracyLevelInput = {
      date: testDate
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(testDate);
    expect(result!.total_conspiracy_score).toEqual(75);
    expect(result!.activity_count).toEqual(10);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no conspiracy level exists for date', async () => {
    // Don't insert any data
    const input: GetDailyConspiracyLevelInput = {
      date: new Date('2024-01-15')
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result).toBeNull();
  });

  it('should handle different date formats correctly', async () => {
    // Insert test data for multiple dates
    const date1 = '2024-01-15';
    const date2 = '2024-01-16';
    
    await db.insert(dailyConspiracyLevelsTable)
      .values([
        {
          date: date1,
          total_conspiracy_score: 50,
          activity_count: 5
        },
        {
          date: date2,
          total_conspiracy_score: 85,
          activity_count: 12
        }
      ])
      .execute();

    // Test with Date object that should match first record
    const input1: GetDailyConspiracyLevelInput = {
      date: new Date('2024-01-15T10:30:00Z') // Time should be ignored
    };

    const result1 = await getDailyConspiracyLevel(input1);
    expect(result1).not.toBeNull();
    expect(result1!.total_conspiracy_score).toEqual(50);

    // Test with Date object that should match second record
    const input2: GetDailyConspiracyLevelInput = {
      date: new Date('2024-01-16T23:59:59Z') // Time should be ignored
    };

    const result2 = await getDailyConspiracyLevel(input2);
    expect(result2).not.toBeNull();
    expect(result2!.total_conspiracy_score).toEqual(85);
  });

  it('should return correct record when multiple records exist', async () => {
    // Insert multiple records for different dates
    await db.insert(dailyConspiracyLevelsTable)
      .values([
        {
          date: '2024-01-14',
          total_conspiracy_score: 30,
          activity_count: 3
        },
        {
          date: '2024-01-15',
          total_conspiracy_score: 60,
          activity_count: 8
        },
        {
          date: '2024-01-16',
          total_conspiracy_score: 90,
          activity_count: 15
        }
      ])
      .execute();

    // Test that we get the correct specific record
    const input: GetDailyConspiracyLevelInput = {
      date: new Date('2024-01-15')
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result).not.toBeNull();
    expect(result!.total_conspiracy_score).toEqual(60);
    expect(result!.activity_count).toEqual(8);
    expect(result!.date).toEqual(new Date('2024-01-15'));
  });

  it('should handle edge case dates correctly', async () => {
    // Test with leap year date
    const leapYearDate = new Date('2024-02-29');
    const dateString = '2024-02-29';
    
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: dateString,
        total_conspiracy_score: 100,
        activity_count: 20
      })
      .execute();

    const input: GetDailyConspiracyLevelInput = {
      date: leapYearDate
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(leapYearDate);
    expect(result!.total_conspiracy_score).toEqual(100);
  });

  it('should handle today\'s date correctly', async () => {
    // Use today's date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: todayString,
        total_conspiracy_score: 42,
        activity_count: 7
      })
      .execute();

    const input: GetDailyConspiracyLevelInput = {
      date: today
    };

    const result = await getDailyConspiracyLevel(input);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date(todayString));
    expect(result!.total_conspiracy_score).toEqual(42);
    expect(result!.activity_count).toEqual(7);
  });
});
