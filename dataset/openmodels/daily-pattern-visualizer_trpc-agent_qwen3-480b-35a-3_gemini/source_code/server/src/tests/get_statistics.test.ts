import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { getStatistics } from '../handlers/get_statistics';

describe('getStatistics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty statistics for a user with no entries', async () => {
    const result = await getStatistics('test-user');

    expect(result.dailyAverage.sleepHours).toEqual(0);
    expect(result.dailyAverage.workHours).toEqual(0);
    expect(result.dailyAverage.socialTime).toEqual(0);
    expect(result.dailyAverage.screenTime).toEqual(0);
    expect(result.dailyAverage.emotionalEnergy).toEqual(0);
    expect(result.weeklyPattern).toEqual([]);
  });

  it('should calculate correct daily averages for a single entry', async () => {
    // Insert a test entry
    await db.insert(activityEntriesTable).values({
      user_id: 'test-user',
      date: new Date('2023-01-02'),
      sleep_hours: '8.0',
      work_hours: '8.0',
      social_time: '2.0',
      screen_time: '4.0',
      emotional_energy: 7
    }).execute();

    const result = await getStatistics('test-user');

    expect(result.dailyAverage.sleepHours).toBeCloseTo(8.0);
    expect(result.dailyAverage.workHours).toBeCloseTo(8.0);
    expect(result.dailyAverage.socialTime).toBeCloseTo(2.0);
    expect(result.dailyAverage.screenTime).toBeCloseTo(4.0);
    expect(result.dailyAverage.emotionalEnergy).toBeCloseTo(7.0);
    expect(result.weeklyPattern).toHaveLength(1);
  });

  it('should calculate correct daily averages for multiple entries', async () => {
    // Insert multiple test entries within the same week (Jan 2-4, 2023 are Monday-Wednesday of the same week)
    await db.insert(activityEntriesTable).values([
      {
        user_id: 'test-user',
        date: new Date('2023-01-02'), // Monday
        sleep_hours: '8.0',
        work_hours: '8.0',
        social_time: '2.0',
        screen_time: '4.0',
        emotional_energy: 7
      },
      {
        user_id: 'test-user',
        date: new Date('2023-01-03'), // Tuesday
        sleep_hours: '6.0',
        work_hours: '10.0',
        social_time: '1.0',
        screen_time: '6.0',
        emotional_energy: 5
      },
      {
        user_id: 'test-user',
        date: new Date('2023-01-04'), // Wednesday
        sleep_hours: '7.0',
        work_hours: '9.0',
        social_time: '3.0',
        screen_time: '5.0',
        emotional_energy: 8
      }
    ]).execute();

    const result = await getStatistics('test-user');

    // Averages: sleep=(8+6+7)/3=7, work=(8+10+9)/3=9, social=(2+1+3)/3=2, screen=(4+6+5)/3=5, energy=(7+5+8)/3=6.67
    expect(result.dailyAverage.sleepHours).toBeCloseTo(7.0);
    expect(result.dailyAverage.workHours).toBeCloseTo(9.0);
    expect(result.dailyAverage.socialTime).toBeCloseTo(2.0);
    expect(result.dailyAverage.screenTime).toBeCloseTo(5.0);
    expect(result.dailyAverage.emotionalEnergy).toBeCloseTo(6.67);
    expect(result.weeklyPattern).toHaveLength(1);
  });

  it('should calculate correct weekly pattern data', async () => {
    // Insert test entries for one week (Jan 2-3, 2023 are Monday-Tuesday)
    await db.insert(activityEntriesTable).values([
      {
        user_id: 'test-user',
        date: new Date('2023-01-02'), // Monday
        sleep_hours: '8.0',
        work_hours: '8.0',
        social_time: '2.0',
        screen_time: '4.0',
        emotional_energy: 7
      },
      {
        user_id: 'test-user',
        date: new Date('2023-01-03'), // Tuesday
        sleep_hours: '6.0',
        work_hours: '10.0',
        social_time: '1.0',
        screen_time: '6.0',
        emotional_energy: 5
      }
    ]).execute();

    const result = await getStatistics('test-user');
    
    expect(result.weeklyPattern).toHaveLength(1);
    
    const weeklyData = result.weeklyPattern[0];
    // Jan 2, 2023 is a Monday, so the week start date should be Jan 2, 2023
    expect(weeklyData.weekStartDate).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    
    // Check that values are correctly distributed by day
    // Monday (index 1) should have sleep=8, Tuesday (index 2) should have sleep=6
    expect(weeklyData.sleepHours[1]).toBeCloseTo(8.0); // Monday
    expect(weeklyData.sleepHours[2]).toBeCloseTo(6.0); // Tuesday
    expect(weeklyData.workHours[1]).toBeCloseTo(8.0); // Monday
    expect(weeklyData.workHours[2]).toBeCloseTo(10.0); // Tuesday
  });

  it('should only include entries for the specified user', async () => {
    // Insert entries for two different users
    await db.insert(activityEntriesTable).values([
      {
        user_id: 'test-user-1',
        date: new Date('2023-01-01'),
        sleep_hours: '8.0',
        work_hours: '8.0',
        social_time: '2.0',
        screen_time: '4.0',
        emotional_energy: 7
      },
      {
        user_id: 'test-user-2',
        date: new Date('2023-01-01'),
        sleep_hours: '6.0',
        work_hours: '6.0',
        social_time: '6.0',
        screen_time: '6.0',
        emotional_energy: 6
      }
    ]).execute();

    const result1 = await getStatistics('test-user-1');
    const result2 = await getStatistics('test-user-2');

    // First user should have averages of 8 hours
    expect(result1.dailyAverage.sleepHours).toBeCloseTo(8.0);
    expect(result1.dailyAverage.workHours).toBeCloseTo(8.0);
    
    // Second user should have averages of 6 hours
    expect(result2.dailyAverage.sleepHours).toBeCloseTo(6.0);
    expect(result2.dailyAverage.workHours).toBeCloseTo(6.0);
  });
});
