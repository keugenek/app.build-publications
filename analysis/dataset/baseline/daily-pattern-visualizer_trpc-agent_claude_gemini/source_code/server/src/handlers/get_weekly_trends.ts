import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type WeeklyTrends } from '../schema';
import { gte, lte, and, asc } from 'drizzle-orm';

export async function getWeeklyTrends(startDate?: string): Promise<WeeklyTrends> {
  try {
    // Calculate the week start (Monday) and end (Sunday)
    const weekStart = getWeekStart(startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday

    // Query logs for the week
    const logs = await db.select()
      .from(dailyLogsTable)
      .where(
        and(
          gte(dailyLogsTable.date, weekStart.toISOString().split('T')[0]),
          lte(dailyLogsTable.date, weekEnd.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(dailyLogsTable.date))
      .execute();

    // Create arrays for all 7 days of the week
    const dates: string[] = [];
    const sleep_duration: number[] = [];
    const work_hours: number[] = [];
    const social_time: number[] = [];
    const screen_time: number[] = [];
    const emotional_energy: number[] = [];

    // Generate all 7 days of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);

      // Find log for this date or use 0/default values
      const logForDate = logs.find(log => log.date === dateStr);
      
      if (logForDate) {
        sleep_duration.push(logForDate.sleep_duration);
        work_hours.push(logForDate.work_hours);
        social_time.push(logForDate.social_time);
        screen_time.push(logForDate.screen_time);
        emotional_energy.push(logForDate.emotional_energy);
      } else {
        // Default values for missing days
        sleep_duration.push(0);
        work_hours.push(0);
        social_time.push(0);
        screen_time.push(0);
        emotional_energy.push(0);
      }
    }

    return {
      dates,
      sleep_duration,
      work_hours,
      social_time,
      screen_time,
      emotional_energy
    };
  } catch (error) {
    console.error('Get weekly trends failed:', error);
    throw error;
  }
}

// Helper function to get the start of the week (Monday)
function getWeekStart(startDate?: string): Date {
  let date: Date;
  
  if (startDate) {
    date = new Date(startDate + 'T00:00:00.000Z');
  } else {
    date = new Date();
  }
  
  // Get Monday of the week
  const dayOfWeek = date.getDay();
  const daysToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek); // Sunday is 0, so -6 to get to Monday
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0); // Set to start of day
  
  return monday;
}
