import { type Task } from '../schema';

/**
 * Placeholder handler to fetch all tasks.
 * Real implementation would query the database.
 */
import { db } from '../db';
import { tasksTable } from '../db/schema';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const results = await db.select().from(tasksTable).execute();
    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};
