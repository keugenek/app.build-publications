import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable } from '../db/schema';
import { type GetByIdInput, type QuizWithQuestions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuizWithQuestions(input: GetByIdInput): Promise<QuizWithQuestions | null> {
  try {
    // First, get the quiz
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.id))
      .execute();

    if (quiz.length === 0) {
      return null;
    }

    // Get questions associated with this quiz
    const quizQuestionsResults = await db.select()
      .from(quizQuestionsTable)
      .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
      .where(eq(quizQuestionsTable.quiz_id, input.id))
      .execute();

    // Map questions from the joined results
    const questions = quizQuestionsResults.map(result => result.questions);

    return {
      id: quiz[0].id,
      title: quiz[0].title,
      created_at: quiz[0].created_at,
      questions: questions
    };
  } catch (error) {
    console.error('Get quiz with questions failed:', error);
    throw error;
  }
}
