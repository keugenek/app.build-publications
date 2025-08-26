import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteQuestion = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the question - cascading deletion will handle multiple choice options
    // and quiz_questions references automatically due to foreign key constraints
    const result = await db.delete(questionsTable)
      .where(eq(questionsTable.id, id))
      .execute();

    // Check if any rows were affected (question existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Question deletion failed:', error);
    throw error;
  }
};
