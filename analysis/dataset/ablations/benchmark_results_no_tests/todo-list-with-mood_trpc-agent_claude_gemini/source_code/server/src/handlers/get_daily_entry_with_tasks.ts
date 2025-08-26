import { db } from '../db';
import { dailyEntriesTable, tasksTable } from '../db/schema';
import { type DailyEntryWithTasks } from '../schema';
import { eq } from 'drizzle-orm';

export const getDailyEntryWithTasks = async (entryId: number): Promise<DailyEntryWithTasks | null> => {
  try {
    // Get the daily entry
    const dailyEntries = await db.select()
      .from(dailyEntriesTable)
      .where(eq(dailyEntriesTable.id, entryId))
      .execute();

    if (dailyEntries.length === 0) {
      return null;
    }

    const dailyEntry = dailyEntries[0];

    // Get all tasks for this daily entry
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.daily_entry_id, entryId))
      .execute();

    // Return the complete daily entry with tasks
    return {
      id: dailyEntry.id,
      date: new Date(dailyEntry.date), // Convert string to Date
      mood: dailyEntry.mood,
      notes: dailyEntry.notes,
      created_at: dailyEntry.created_at,
      updated_at: dailyEntry.updated_at,
      tasks: tasks
    };
  } catch (error) {
    console.error('Failed to get daily entry with tasks:', error);
    throw error;
  }
};
