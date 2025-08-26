import { type Task } from '../schema';
import { db } from '../db';
import { tasksTable } from '../db/schema';

/**
 * Placeholder handler for fetching all tasks.
 */
export const getTasks = async (): Promise<Task[]> => {
  const results = await db.select().from(tasksTable).execute();
  return results;
  return [];
};
