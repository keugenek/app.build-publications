import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable } from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export const addQuestionToQuiz = async (quizId: number, questionId: number, orderIndex: number): Promise<{ success: boolean }> => {
  try {
    // Validate that the quiz exists
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    if (quiz.length === 0) {
      throw new Error(`Quiz with id ${quizId} not found`);
    }

    // Validate that the question exists
    const question = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    if (question.length === 0) {
      throw new Error(`Question with id ${questionId} not found`);
    }

    // Check if the question is already in this quiz
    const existingQuizQuestion = await db.select()
      .from(quizQuestionsTable)
      .where(
        and(
          eq(quizQuestionsTable.quiz_id, quizId),
          eq(quizQuestionsTable.question_id, questionId)
        )
      )
      .execute();

    if (existingQuizQuestion.length > 0) {
      throw new Error(`Question ${questionId} is already in quiz ${quizId}`);
    }

    // Shift existing questions with order_index >= orderIndex to make room
    await db.update(quizQuestionsTable)
      .set({
        order_index: sql`${quizQuestionsTable.order_index} + 1`
      })
      .where(
        and(
          eq(quizQuestionsTable.quiz_id, quizId),
          gte(quizQuestionsTable.order_index, orderIndex)
        )
      )
      .execute();

    // Insert the new quiz question
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizId,
        question_id: questionId,
        order_index: orderIndex
      })
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Adding question to quiz failed:', error);
    throw error;
  }
};
