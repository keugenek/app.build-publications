import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { type QuizWithQuestions } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getQuizById = async (id: number): Promise<QuizWithQuestions | null> => {
  try {
    // First, get the quiz
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, id))
      .execute();

    if (quiz.length === 0) {
      return null;
    }

    // Get questions for this quiz with their order
    const quizWithQuestions = await db.select({
      quiz_id: quizQuestionsTable.quiz_id,
      order_index: quizQuestionsTable.order_index,
      question_id: questionsTable.id,
      question_text: questionsTable.question_text,
      subject_id: questionsTable.subject_id,
      topic_id: questionsTable.topic_id,
      type: questionsTable.type,
      answer: questionsTable.answer,
      question_created_at: questionsTable.created_at,
      question_updated_at: questionsTable.updated_at
    })
      .from(quizQuestionsTable)
      .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
      .where(eq(quizQuestionsTable.quiz_id, id))
      .orderBy(asc(quizQuestionsTable.order_index))
      .execute();

    // Get multiple choice options for all questions in this quiz
    const questionIds = quizWithQuestions.map(q => q.question_id);
    const options = questionIds.length > 0 
      ? await db.select()
          .from(multipleChoiceOptionsTable)
          .where(eq(multipleChoiceOptionsTable.question_id, questionIds[0])) // We'll handle multiple IDs differently
          .execute()
      : [];

    // For multiple question IDs, we need to fetch options for all of them
    const allOptions = questionIds.length > 0 
      ? await db.select()
          .from(multipleChoiceOptionsTable)
          .execute()
      : [];

    // Filter options that belong to our questions
    const relevantOptions = allOptions.filter(option => 
      questionIds.includes(option.question_id)
    );

    // Group options by question_id
    const optionsByQuestionId = relevantOptions.reduce((acc, option) => {
      if (!acc[option.question_id]) {
        acc[option.question_id] = [];
      }
      acc[option.question_id].push({
        id: option.id,
        question_id: option.question_id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        created_at: option.created_at
      });
      return acc;
    }, {} as Record<number, any[]>);

    // Build the questions array with options
    const questions = quizWithQuestions.map(q => ({
      id: q.question_id,
      question_text: q.question_text,
      subject_id: q.subject_id,
      topic_id: q.topic_id,
      type: q.type,
      answer: q.answer,
      created_at: q.question_created_at,
      updated_at: q.question_updated_at
    }));

    return {
      id: quiz[0].id,
      title: quiz[0].title,
      description: quiz[0].description,
      created_at: quiz[0].created_at,
      questions
    };
  } catch (error) {
    console.error('Failed to get quiz by id:', error);
    throw error;
  }
};
