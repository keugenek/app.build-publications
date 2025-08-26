import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput, type DailyLog } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function createDailyLog(input: CreateDailyLogInput): Promise<DailyLog> {
  try {
    // Use PostgreSQL's ON CONFLICT clause to handle upsert (insert or update)
    const result = await db
      .insert(dailyLogsTable)
      .values({
        date: input.date,
        sleep_duration: input.sleep_duration,
        work_hours: input.work_hours,
        social_time: input.social_time,
        screen_time: input.screen_time,
        emotional_energy: input.emotional_energy,
      })
      .onConflictDoUpdate({
        target: dailyLogsTable.date,
        set: {
          sleep_duration: input.sleep_duration,
          work_hours: input.work_hours,
          social_time: input.social_time,
          screen_time: input.screen_time,
          emotional_energy: input.emotional_energy,
          updated_at: sql`now()`,
        },
      })
      .returning()
      .execute();

    const dailyLog = result[0];
    
    // Convert the result to match the expected DailyLog type
    return {
      id: dailyLog.id,
      date: new Date(dailyLog.date),
      sleep_duration: dailyLog.sleep_duration,
      work_hours: dailyLog.work_hours,
      social_time: dailyLog.social_time,
      screen_time: dailyLog.screen_time,
      emotional_energy: dailyLog.emotional_energy,
      created_at: dailyLog.created_at,
      updated_at: dailyLog.updated_at,
    };
  } catch (error) {
    console.error('Daily log creation failed:', error);
    throw error;
  }
}
