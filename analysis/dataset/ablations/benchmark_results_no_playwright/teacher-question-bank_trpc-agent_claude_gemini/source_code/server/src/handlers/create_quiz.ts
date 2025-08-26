import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable } from '../db/schema';
import { type CreateQuizInput, type Quiz } from '../schema';
import { inArray, eq } from 'drizzle-orm';

export const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  try {
    // First, validate that all question IDs exist
    const existingQuestions = await db.select({ id: questionsTable.id })
      .from(questionsTable)
      .where(inArray(questionsTable.id, input.question_ids))
      .execute();

    const existingQuestionIds = existingQuestions.map(q => q.id);
    const missingQuestionIds = input.question_ids.filter(id => !existingQuestionIds.includes(id));

    if (missingQuestionIds.length > 0) {
      throw new Error(`Questions with IDs ${missingQuestionIds.join(', ')} do not exist`);
    }

    // Create the quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: input.title
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create quiz-question associations
    const quizQuestionEntries = input.question_ids.map(questionId => ({
      quiz_id: quiz.id,
      question_id: questionId
    }));

    await db.insert(quizQuestionsTable)
      .values(quizQuestionEntries)
      .execute();

    return quiz;
  } catch (error) {
    console.error('Quiz creation failed:', error);
    throw error;
  }
};
