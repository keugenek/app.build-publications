import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { desc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Fetch all tasks ordered by creation date (newest first)
    const results = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.created_at))
      .execute();

    // Return tasks with proper type conversions
    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};
