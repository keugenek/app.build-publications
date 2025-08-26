import { db } from '../db';
import { quizzesTable, quizQuestionsTable } from '../db/schema';
import { type DeleteQuizInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteQuiz(input: DeleteQuizInput): Promise<{ success: boolean }> {
  try {
    // First, check if quiz exists
    const existingQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.id))
      .execute();

    if (existingQuiz.length === 0) {
      throw new Error(`Quiz with id ${input.id} not found`);
    }

    // Delete related quiz_questions entries first (foreign key constraint)
    await db.delete(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, input.id))
      .execute();

    // Delete the quiz
    await db.delete(quizzesTable)
      .where(eq(quizzesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Quiz deletion failed:', error);
    throw error;
  }
}
