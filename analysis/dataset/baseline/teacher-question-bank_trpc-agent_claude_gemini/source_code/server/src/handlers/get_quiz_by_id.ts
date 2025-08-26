import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable } from '../db/schema';
import { type GetByIdInput, type QuizWithQuestions } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getQuizById = async (input: GetByIdInput): Promise<QuizWithQuestions> => {
  try {
    // First, get the quiz data
    const quizResult = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.id))
      .execute();

    if (quizResult.length === 0) {
      throw new Error(`Quiz with id ${input.id} not found`);
    }

    const quiz = quizResult[0];

    // Get all questions for this quiz with their order
    const questionsResult = await db.select({
      // Quiz question metadata
      quiz_id: quizQuestionsTable.quiz_id,
      question_order: quizQuestionsTable.question_order,
      // All question data
      id: questionsTable.id,
      question_text: questionsTable.question_text,
      option_a: questionsTable.option_a,
      option_b: questionsTable.option_b,
      option_c: questionsTable.option_c,
      option_d: questionsTable.option_d,
      correct_answer: questionsTable.correct_answer,
      explanation: questionsTable.explanation,
      difficulty_level: questionsTable.difficulty_level,
      subject_id: questionsTable.subject_id,
      topic_id: questionsTable.topic_id,
      created_at: questionsTable.created_at,
      updated_at: questionsTable.updated_at
    })
      .from(quizQuestionsTable)
      .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
      .where(eq(quizQuestionsTable.quiz_id, input.id))
      .orderBy(asc(quizQuestionsTable.question_order))
      .execute();

    // Transform the questions to match the Question schema
    const questions = questionsResult.map(result => ({
      id: result.id,
      question_text: result.question_text,
      option_a: result.option_a,
      option_b: result.option_b,
      option_c: result.option_c,
      option_d: result.option_d,
      correct_answer: result.correct_answer,
      explanation: result.explanation,
      difficulty_level: result.difficulty_level,
      subject_id: result.subject_id,
      topic_id: result.topic_id,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      created_at: quiz.created_at,
      questions
    };
  } catch (error) {
    console.error('Failed to get quiz by id:', error);
    throw error;
  }
};
