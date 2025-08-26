import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<boolean> => {
  try {
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();
    
    // Return true if a task was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
