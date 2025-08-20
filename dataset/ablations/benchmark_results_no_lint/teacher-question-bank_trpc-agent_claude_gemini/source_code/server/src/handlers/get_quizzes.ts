import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable } from '../db/schema';
import { type Quiz, type QuizWithQuestions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuizzes(): Promise<Quiz[]> {
  try {
    const results = await db.select()
      .from(quizzesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    throw error;
  }
}

export async function getQuizWithQuestions(quizId: number): Promise<QuizWithQuestions | null> {
  try {
    // First, get the quiz
    const quizResults = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    if (quizResults.length === 0) {
      return null;
    }

    const quiz = quizResults[0];

    // Then, get all questions for this quiz with their order
    const questionsResults = await db.select({
      id: questionsTable.id,
      question_text: questionsTable.question_text,
      answer_text: questionsTable.answer_text,
      subject_id: questionsTable.subject_id,
      topic_id: questionsTable.topic_id,
      created_at: questionsTable.created_at,
      order_index: quizQuestionsTable.order_index
    })
      .from(questionsTable)
      .innerJoin(quizQuestionsTable, eq(questionsTable.id, quizQuestionsTable.question_id))
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .orderBy(quizQuestionsTable.order_index)
      .execute();

    // Transform the questions to match the expected schema (remove order_index)
    const questions = questionsResults.map(q => ({
      id: q.id,
      question_text: q.question_text,
      answer_text: q.answer_text,
      subject_id: q.subject_id,
      topic_id: q.topic_id,
      created_at: q.created_at
    }));

    return {
      ...quiz,
      questions
    };
  } catch (error) {
    console.error('Failed to fetch quiz with questions:', error);
    throw error;
  }
}
