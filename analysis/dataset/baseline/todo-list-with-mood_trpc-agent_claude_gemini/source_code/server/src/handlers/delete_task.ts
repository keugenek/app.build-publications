import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (id: number): Promise<void> => {
  try {
    // First check if task exists
    const existingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();

    if (existingTask.length === 0) {
      throw new Error(`Task with ID ${id} not found`);
    }

    // Delete the task
    await db.delete(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
