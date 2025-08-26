import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTaskInput } from '../schema';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean }> => {
  try {
    // Delete the task by ID
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
