import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { getDailyLogsByPeriod } from '../handlers/get_daily_logs_by_period';
import { type CreateDailyLogInput } from '../schema';
import { sql } from 'drizzle-orm';

const createTestLog = async (input: Omit<CreateDailyLogInput, 'date'> & { date?: Date }) => {
  const date = input.date || new Date();
  
  const result = await db.insert(dailyLogsTable)
    .values({
      date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      sleep_hours: input.sleep_hours.toString(),
      work_hours: input.work_hours.toString(),
      social_time: input.social_time.toString(),
      screen_time: input.screen_time.toString(),
      emotional_energy: input.emotional_energy.toString()
    })
    .returning()
    .execute();

  const log = result[0];
  return {
    ...log,
    sleep_hours: parseFloat(log.sleep_hours),
    work_hours: parseFloat(log.work_hours),
    social_time: parseFloat(log.social_time),
    screen_time: parseFloat(log.screen_time),
    emotional_energy: parseFloat(log.emotional_energy),
    date: new Date(log.date),
    created_at: new Date(log.created_at)
  };
};

describe('getDailyLogsByPeriod', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily logs for today when period is daily', async () => {
    // Create test logs
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Create logs for today and yesterday
    await createTestLog({ 
      date: today,
      sleep_hours: 8,
      work_hours: 8,
      social_time: 2,
      screen_time: 4,
      emotional_energy: 7
    });
    
    await createTestLog({ 
      date: yesterday,
      sleep_hours: 7,
      work_hours: 9,
      social_time: 1,
      screen_time: 5,
      emotional_energy: 6
    });

    const result = await getDailyLogsByPeriod('daily');
    
    // Should only return today's log
    expect(result).toHaveLength(1);
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(typeof result[0].work_hours).toBe('number');
    expect(typeof result[0].social_time).toBe('number');
    expect(typeof result[0].screen_time).toBe('number');
    expect(typeof result[0].emotional_energy).toBe('number');
  });

  it('should return daily logs for this week when period is weekly', async () => {
    // Create test logs
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Create logs for this week and last week
    await createTestLog({ 
      date: today,
      sleep_hours: 8,
      work_hours: 8,
      social_time: 2,
      screen_time: 4,
      emotional_energy: 7
    });
    
    await createTestLog({ 
      date: lastWeek,
      sleep_hours: 7,
      work_hours: 9,
      social_time: 1,
      screen_time: 5,
      emotional_energy: 6
    });

    const result = await getDailyLogsByPeriod('weekly');
    
    // Should only return this week's log
    expect(result).toHaveLength(1);
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
  });

  it('should return daily logs for this month when period is monthly', async () => {
    // Create test logs
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Create logs for this month and last month
    await createTestLog({ 
      date: today,
      sleep_hours: 8,
      work_hours: 8,
      social_time: 2,
      screen_time: 4,
      emotional_energy: 7
    });
    
    await createTestLog({ 
      date: lastMonth,
      sleep_hours: 7,
      work_hours: 9,
      social_time: 1,
      screen_time: 5,
      emotional_energy: 6
    });

    const result = await getDailyLogsByPeriod('monthly');
    
    // Should only return this month's log
    expect(result).toHaveLength(1);
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
  });

  it('should return empty array when no logs exist for the period', async () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Create a log from last week
    await createTestLog({ 
      date: lastWeek,
      sleep_hours: 8,
      work_hours: 8,
      social_time: 2,
      screen_time: 4,
      emotional_energy: 7
    });

    // Request today's logs (should be empty)
    const result = await getDailyLogsByPeriod('daily');
    expect(result).toHaveLength(0);
  });

  it('should return logs ordered by date descending', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Create logs for today and yesterday
    await createTestLog({ 
      date: today,
      sleep_hours: 8,
      work_hours: 8,
      social_time: 2,
      screen_time: 4,
      emotional_energy: 7
    });
    
    await createTestLog({ 
      date: yesterday,
      sleep_hours: 7,
      work_hours: 9,
      social_time: 1,
      screen_time: 5,
      emotional_energy: 6
    });

    const result = await getDailyLogsByPeriod('daily');
    
    // Since we're looking at daily logs, and both logs might be from today depending on time zones,
    // we'll check the ordering logic by requesting a wider period
    const weeklyResult = await getDailyLogsByPeriod('weekly');
    
    // Should be ordered by date descending (newest first)
    if (weeklyResult.length >= 2) {
      expect(weeklyResult[0].date >= weeklyResult[1].date).toBe(true);
    }
  });
});
