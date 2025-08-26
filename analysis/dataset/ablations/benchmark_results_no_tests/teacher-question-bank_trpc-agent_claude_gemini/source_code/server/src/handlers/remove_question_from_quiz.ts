import { db } from '../db';
import { quizQuestionsTable } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

export const removeQuestionFromQuiz = async (quizId: number, questionId: number): Promise<{ success: boolean }> => {
  try {
    // First, get the order_index of the question being removed
    const questionToRemove = await db.select()
      .from(quizQuestionsTable)
      .where(and(
        eq(quizQuestionsTable.quiz_id, quizId),
        eq(quizQuestionsTable.question_id, questionId)
      ))
      .execute();

    if (questionToRemove.length === 0) {
      // Question is not in the quiz, consider it successfully removed
      return { success: true };
    }

    const removedOrderIndex = questionToRemove[0].order_index;

    // Remove the question from the quiz
    await db.delete(quizQuestionsTable)
      .where(and(
        eq(quizQuestionsTable.quiz_id, quizId),
        eq(quizQuestionsTable.question_id, questionId)
      ))
      .execute();

    // Reorder remaining questions by decrementing order_index for all questions
    // that had a higher order_index than the removed question
    await db.update(quizQuestionsTable)
      .set({ order_index: sql`${quizQuestionsTable.order_index} - 1` })
      .where(and(
        eq(quizQuestionsTable.quiz_id, quizId),
        gt(quizQuestionsTable.order_index, removedOrderIndex)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Remove question from quiz failed:', error);
    throw error;
  }
};
