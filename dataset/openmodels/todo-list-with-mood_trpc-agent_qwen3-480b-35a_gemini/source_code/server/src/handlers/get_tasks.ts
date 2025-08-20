import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .orderBy(tasksTable.created_at)
      .execute();

    return results.map(task => ({
      ...task,
      created_at: new Date(task.created_at),
      updated_at: task.updated_at ? new Date(task.updated_at) : null
    }));
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};
