import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .execute();

    // Convert date strings to Date objects and return tasks
    return results.map(task => ({
      ...task,
      due_date: new Date(task.due_date),
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};
