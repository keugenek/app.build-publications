import { db } from '../db';
import { dailyEntriesTable, tasksTable } from '../db/schema';
import { type DailyEntryWithTasks } from '../schema';
import { eq } from 'drizzle-orm';

export const getDailyEntryByDate = async (date: Date): Promise<DailyEntryWithTasks | null> => {
  try {
    // Format the date to YYYY-MM-DD string for PostgreSQL date comparison
    const dateString = date.toISOString().split('T')[0];

    // First, find the daily entry for the specific date
    const dailyEntries = await db.select()
      .from(dailyEntriesTable)
      .where(eq(dailyEntriesTable.date, dateString))
      .execute();

    // If no entry exists for this date, return null
    if (dailyEntries.length === 0) {
      return null;
    }

    const dailyEntry = dailyEntries[0];

    // Get all tasks associated with this daily entry
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.daily_entry_id, dailyEntry.id))
      .execute();

    // Return the daily entry with its tasks
    return {
      id: dailyEntry.id,
      date: new Date(dailyEntry.date), // Convert string date to Date object
      mood: dailyEntry.mood,
      notes: dailyEntry.notes,
      created_at: dailyEntry.created_at,
      updated_at: dailyEntry.updated_at,
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        is_completed: task.is_completed,
        created_at: task.created_at,
        completed_at: task.completed_at,
        daily_entry_id: task.daily_entry_id
      }))
    };
  } catch (error) {
    console.error('Failed to get daily entry by date:', error);
    throw error;
  }
};
