import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type DailySummary } from '../schema';
import { eq, and, gte, lt, isNotNull } from 'drizzle-orm';

export const getDailySummary = async (date: string): Promise<DailySummary> => {
  try {
    const summaryDate = new Date(date);
    
    // Create date range for the specific day
    const startOfDay = new Date(summaryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(summaryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Format date for mood entry query (YYYY-MM-DD format)
    const dateString = summaryDate.toISOString().split('T')[0];

    // Query completed tasks for the day
    const completedTasks = await db.select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.is_completed, true),
          isNotNull(tasksTable.completed_at),
          gte(tasksTable.completed_at, startOfDay),
          lt(tasksTable.completed_at, endOfDay)
        )
      )
      .execute();

    // Query all tasks created on or before this date (for total count)
    const allTasks = await db.select()
      .from(tasksTable)
      .where(gte(tasksTable.created_at, startOfDay))
      .execute();

    // Query mood entry for the specific date
    const moodEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, dateString))
      .execute();

    const moodEntry = moodEntries.length > 0 ? moodEntries[0] : null;

    // Convert mood entry date from string to Date object if it exists
    const processedMoodEntry = moodEntry ? {
      ...moodEntry,
      date: new Date(moodEntry.date)
    } : null;

    return {
      date: summaryDate,
      completed_tasks: completedTasks,
      mood_entry: processedMoodEntry,
      total_tasks: allTasks.length,
      completed_tasks_count: completedTasks.length,
    };
  } catch (error) {
    console.error('Daily summary fetch failed:', error);
    throw error;
  }
};
