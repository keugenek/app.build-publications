import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteQuiz = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the quiz by ID
    // The database cascade delete will automatically remove quiz-question associations
    const result = await db.delete(quizzesTable)
      .where(eq(quizzesTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether a row was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Quiz deletion failed:', error);
    throw error;
  }
};
