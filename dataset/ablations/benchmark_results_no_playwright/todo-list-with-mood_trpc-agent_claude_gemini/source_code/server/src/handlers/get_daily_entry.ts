import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type GetDailyEntryInput, type DailyEntry } from '../schema';
import { eq, and, gte, lt } from 'drizzle-orm';

export async function getDailyEntry(input: GetDailyEntryInput): Promise<DailyEntry> {
  try {
    const targetDate = new Date(input.date);
    
    // Calculate start and end of the target date for filtering tasks
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch tasks created on the target date
    const tasks = await db.select()
      .from(tasksTable)
      .where(
        and(
          gte(tasksTable.created_at, startOfDay),
          lt(tasksTable.created_at, endOfDay)
        )
      )
      .execute();

    // Fetch mood entry for the target date
    const moodEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, input.date))
      .execute();

    // There should be at most one mood entry per date
    // Convert the date string to Date object to match schema expectations
    const moodEntry = moodEntries.length > 0 ? {
      ...moodEntries[0],
      date: new Date(moodEntries[0].date)
    } : null;

    return {
      date: targetDate,
      tasks: tasks,
      mood_entry: moodEntry
    };
  } catch (error) {
    console.error('Failed to get daily entry:', error);
    throw error;
  }
}
