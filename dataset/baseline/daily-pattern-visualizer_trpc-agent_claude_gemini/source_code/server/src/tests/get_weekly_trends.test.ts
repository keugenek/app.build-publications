import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { getWeeklyTrends } from '../handlers/get_weekly_trends';

describe('getWeeklyTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return weekly trends with all 7 days', async () => {
    // Create test data for a full week (Monday to Sunday)
    const testLogs = [
      {
        date: '2024-01-01', // Monday
        sleep_duration: 8.0,
        work_hours: 8.0,
        social_time: 2.0,
        screen_time: 6.0,
        emotional_energy: 7
      },
      {
        date: '2024-01-02', // Tuesday
        sleep_duration: 7.5,
        work_hours: 9.0,
        social_time: 1.5,
        screen_time: 7.0,
        emotional_energy: 6
      },
      {
        date: '2024-01-07', // Sunday
        sleep_duration: 9.0,
        work_hours: 0.0,
        social_time: 5.0,
        screen_time: 4.0,
        emotional_energy: 9
      }
    ];

    // Insert test data
    await db.insert(dailyLogsTable).values(testLogs).execute();

    // Get trends for the week starting 2024-01-01 (Monday)
    const result = await getWeeklyTrends('2024-01-01');

    // Should return exactly 7 days
    expect(result.dates).toHaveLength(7);
    expect(result.sleep_duration).toHaveLength(7);
    expect(result.work_hours).toHaveLength(7);
    expect(result.social_time).toHaveLength(7);
    expect(result.screen_time).toHaveLength(7);
    expect(result.emotional_energy).toHaveLength(7);

    // Check date range (Monday to Sunday)
    expect(result.dates[0]).toEqual('2024-01-01'); // Monday
    expect(result.dates[6]).toEqual('2024-01-07'); // Sunday

    // Check data for existing logs
    expect(result.sleep_duration[0]).toEqual(8.0); // Monday
    expect(result.work_hours[1]).toEqual(9.0); // Tuesday
    expect(result.emotional_energy[6]).toEqual(9); // Sunday

    // Check default values for missing days
    expect(result.sleep_duration[2]).toEqual(0); // Wednesday (no data)
    expect(result.work_hours[3]).toEqual(0); // Thursday (no data)
    expect(result.social_time[4]).toEqual(0); // Friday (no data)
  });

  it('should return all zeros for week with no data', async () => {
    // Get trends for a week with no data
    const result = await getWeeklyTrends('2024-02-05');

    // Should still return 7 days
    expect(result.dates).toHaveLength(7);
    expect(result.dates[0]).toEqual('2024-02-05'); // Monday
    expect(result.dates[6]).toEqual('2024-02-11'); // Sunday

    // All values should be 0
    result.sleep_duration.forEach(value => expect(value).toEqual(0));
    result.work_hours.forEach(value => expect(value).toEqual(0));
    result.social_time.forEach(value => expect(value).toEqual(0));
    result.screen_time.forEach(value => expect(value).toEqual(0));
    result.emotional_energy.forEach(value => expect(value).toEqual(0));
  });

  it('should handle current week when no startDate provided', async () => {
    // Create a log for today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    await db.insert(dailyLogsTable).values({
      date: todayStr,
      sleep_duration: 7.5,
      work_hours: 8.5,
      social_time: 2.5,
      screen_time: 6.5,
      emotional_energy: 8
    }).execute();

    // Get current week trends
    const result = await getWeeklyTrends();

    // Should return 7 days
    expect(result.dates).toHaveLength(7);
    
    // Should include today in the week
    expect(result.dates).toContain(todayStr);
    
    // Find today's index and check the data
    const todayIndex = result.dates.indexOf(todayStr);
    expect(result.sleep_duration[todayIndex]).toEqual(7.5);
    expect(result.work_hours[todayIndex]).toEqual(8.5);
    expect(result.social_time[todayIndex]).toEqual(2.5);
    expect(result.screen_time[todayIndex]).toEqual(6.5);
    expect(result.emotional_energy[todayIndex]).toEqual(8);
  });

  it('should handle decimal values correctly', async () => {
    // Test with decimal values
    await db.insert(dailyLogsTable).values({
      date: '2024-03-04', // Monday
      sleep_duration: 7.25,
      work_hours: 8.75,
      social_time: 1.5,
      screen_time: 5.33,
      emotional_energy: 6
    }).execute();

    const result = await getWeeklyTrends('2024-03-04');

    // Check decimal precision is maintained
    expect(result.sleep_duration[0]).toEqual(7.25);
    expect(result.work_hours[0]).toEqual(8.75);
    expect(result.social_time[0]).toEqual(1.5);
    expect(result.screen_time[0]).toEqual(5.33);
    expect(result.emotional_energy[0]).toEqual(6);
  });

  it('should return data in chronological order', async () => {
    // Insert data in random order
    const testLogs = [
      {
        date: '2024-04-03', // Wednesday
        sleep_duration: 6.0,
        work_hours: 10.0,
        social_time: 1.0,
        screen_time: 9.0,
        emotional_energy: 4
      },
      {
        date: '2024-04-01', // Monday
        sleep_duration: 8.0,
        work_hours: 8.0,
        social_time: 3.0,
        screen_time: 6.0,
        emotional_energy: 8
      },
      {
        date: '2024-04-05', // Friday
        sleep_duration: 7.0,
        work_hours: 9.0,
        social_time: 2.0,
        screen_time: 7.0,
        emotional_energy: 7
      }
    ];

    await db.insert(dailyLogsTable).values(testLogs).execute();

    const result = await getWeeklyTrends('2024-04-01');

    // Dates should be in chronological order
    expect(result.dates[0]).toEqual('2024-04-01'); // Monday
    expect(result.dates[1]).toEqual('2024-04-02'); // Tuesday
    expect(result.dates[2]).toEqual('2024-04-03'); // Wednesday
    expect(result.dates[4]).toEqual('2024-04-05'); // Friday

    // Data should match the correct days
    expect(result.sleep_duration[0]).toEqual(8.0); // Monday
    expect(result.sleep_duration[2]).toEqual(6.0); // Wednesday
    expect(result.sleep_duration[4]).toEqual(7.0); // Friday
    expect(result.sleep_duration[1]).toEqual(0); // Tuesday (no data)
  });

  it('should handle week starting on different days correctly', async () => {
    // Test with a date that's not Monday
    await db.insert(dailyLogsTable).values({
      date: '2024-05-15', // Wednesday
      sleep_duration: 7.0,
      work_hours: 8.0,
      social_time: 2.0,
      screen_time: 6.0,
      emotional_energy: 7
    }).execute();

    // Pass Wednesday as start date - should still get Monday-Sunday week
    const result = await getWeeklyTrends('2024-05-15');

    // Should start from Monday of that week
    expect(result.dates[0]).toEqual('2024-05-13'); // Monday
    expect(result.dates[6]).toEqual('2024-05-19'); // Sunday
    
    // Wednesday data should be at index 2
    expect(result.dates[2]).toEqual('2024-05-15');
    expect(result.sleep_duration[2]).toEqual(7.0);
  });
});
