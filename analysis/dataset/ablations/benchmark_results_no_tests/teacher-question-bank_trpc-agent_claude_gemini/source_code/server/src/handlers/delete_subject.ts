import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteSubject = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the subject - cascading deletion will automatically handle related topics, questions, etc.
    const result = await db.delete(subjectsTable)
      .where(eq(subjectsTable.id, id))
      .execute();

    // Check if any rows were affected (subject existed and was deleted)
    const success = result.rowCount !== null && result.rowCount > 0;

    return { success };
  } catch (error) {
    console.error('Subject deletion failed:', error);
    throw error;
  }
};
