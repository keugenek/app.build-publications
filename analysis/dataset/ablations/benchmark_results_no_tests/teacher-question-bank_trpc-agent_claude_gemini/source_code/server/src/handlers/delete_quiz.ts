import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteQuiz = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the quiz - cascade delete will handle quiz-question associations
    const result = await db.delete(quizzesTable)
      .where(eq(quizzesTable.id, id))
      .returning()
      .execute();

    // Return success status based on whether any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Quiz deletion failed:', error);
    throw error;
  }
};
