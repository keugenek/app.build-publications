import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteTask(taskId: number): Promise<boolean> {
  try {
    // Delete the task by ID
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    // Return true if a task was deleted, false if no task was found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}
