import { type Task } from '../schema';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (id: number): Promise<Task> => {
  try {
    // Delete the task and return the deleted row
    const deleted = await db
      .delete(tasksTable)
      .where(eq(tasksTable.id, id))
      .returning()
      .execute();

    if (deleted.length === 0) {
      throw new Error(`Task with id ${id} not found`);
    }

    const task = deleted[0];
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      completed: task.completed,
      created_at: task.created_at,
    } as Task;
  } catch (error) {
    console.error('Delete task failed:', error);
    throw error;
  }
};

