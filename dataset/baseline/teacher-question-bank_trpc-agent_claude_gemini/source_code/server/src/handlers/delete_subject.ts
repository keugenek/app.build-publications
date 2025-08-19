import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteSubject = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the subject by ID - cascade deletes will handle related topics and questions
    const result = await db.delete(subjectsTable)
      .where(eq(subjectsTable.id, input.id))
      .execute();

    // Check if any rows were affected (subject existed and was deleted)
    const success = result.rowCount !== null && result.rowCount > 0;
    
    return { success };
  } catch (error) {
    console.error('Subject deletion failed:', error);
    throw error;
  }
};
