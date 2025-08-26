import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studySessionsTable } from '../db/schema';
import { getDailyStats } from '../handlers/get_daily_stats';

describe('getDailyStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no sessions exist for the date', async () => {
    const result = await getDailyStats('2024-01-15');
    expect(result).toBeNull();
  });

  it('should return study session data for existing date', async () => {
    // Insert test data
    const testDate = '2024-01-15';
    const insertResult = await db.insert(studySessionsTable)
      .values({
        date: testDate,
        completed_sessions: 5
      })
      .returning()
      .execute();

    const result = await getDailyStats(testDate);

    expect(result).not.toBeNull();
    expect(result!.id).toBeDefined();
    expect(result!.date).toEqual(testDate);
    expect(result!.completed_sessions).toEqual(5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct data when multiple dates exist', async () => {
    // Insert test data for multiple dates
    await db.insert(studySessionsTable)
      .values([
        { date: '2024-01-15', completed_sessions: 3 },
        { date: '2024-01-16', completed_sessions: 7 },
        { date: '2024-01-17', completed_sessions: 2 }
      ])
      .execute();

    // Test each date returns correct data
    const result1 = await getDailyStats('2024-01-15');
    expect(result1).not.toBeNull();
    expect(result1!.date).toEqual('2024-01-15');
    expect(result1!.completed_sessions).toEqual(3);

    const result2 = await getDailyStats('2024-01-16');
    expect(result2).not.toBeNull();
    expect(result2!.date).toEqual('2024-01-16');
    expect(result2!.completed_sessions).toEqual(7);

    // Test non-existent date still returns null
    const result3 = await getDailyStats('2024-01-20');
    expect(result3).toBeNull();
  });

  it('should handle date format edge cases', async () => {
    // Insert data with different date formats (all valid YYYY-MM-DD)
    await db.insert(studySessionsTable)
      .values([
        { date: '2024-01-01', completed_sessions: 1 }, // New Year's Day
        { date: '2024-12-31', completed_sessions: 10 } // New Year's Eve
      ])
      .execute();

    const newYear = await getDailyStats('2024-01-01');
    expect(newYear).not.toBeNull();
    expect(newYear!.completed_sessions).toEqual(1);

    const newYearEve = await getDailyStats('2024-12-31');
    expect(newYearEve).not.toBeNull();
    expect(newYearEve!.completed_sessions).toEqual(10);
  });

  it('should return data with zero completed sessions', async () => {
    // Test case where session exists but with 0 completed sessions
    const testDate = '2024-01-15';
    await db.insert(studySessionsTable)
      .values({
        date: testDate,
        completed_sessions: 0
      })
      .execute();

    const result = await getDailyStats(testDate);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(testDate);
    expect(result!.completed_sessions).toEqual(0);
    expect(typeof result!.completed_sessions).toEqual('number');
  });
});
