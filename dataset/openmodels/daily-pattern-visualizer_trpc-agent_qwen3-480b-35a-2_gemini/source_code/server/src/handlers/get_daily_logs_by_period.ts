import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type DailyLog } from '../schema';
import { sql } from 'drizzle-orm';

export const getDailyLogsByPeriod = async (period: 'daily' | 'weekly' | 'monthly'): Promise<DailyLog[]> => {
  try {
    // Build conditions based on period
    let dateCondition;
    switch (period) {
      case 'daily':
        dateCondition = sql`date >= CURRENT_DATE`;
        break;
      case 'weekly':
        dateCondition = sql`date >= DATE_TRUNC('week', CURRENT_DATE)`;
        break;
      case 'monthly':
        dateCondition = sql`date >= DATE_TRUNC('month', CURRENT_DATE)`;
        break;
    }

    // Execute query with conditions
    const results = await db.select()
      .from(dailyLogsTable)
      .where(dateCondition)
      .orderBy(sql`date DESC`)
      .execute();
    
    // Convert numeric fields back to numbers before returning
    return results.map(log => ({
      ...log,
      sleep_hours: parseFloat(log.sleep_hours),
      work_hours: parseFloat(log.work_hours),
      social_time: parseFloat(log.social_time),
      screen_time: parseFloat(log.screen_time),
      emotional_energy: parseFloat(log.emotional_energy),
      date: new Date(log.date),
      created_at: new Date(log.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch daily logs by period:', error);
    throw error;
  }
};
