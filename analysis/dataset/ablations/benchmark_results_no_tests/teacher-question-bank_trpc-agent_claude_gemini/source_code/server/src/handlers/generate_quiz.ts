import { db } from '../db';
import { questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput, type QuizWithQuestions } from '../schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const generateQuiz = async (input: GenerateQuizInput): Promise<QuizWithQuestions> => {
  try {
    // Build question filtering conditions
    const conditions: SQL<unknown>[] = [];

    if (input.subject_id !== undefined) {
      conditions.push(eq(questionsTable.subject_id, input.subject_id));
    }

    if (input.topic_id !== undefined) {
      conditions.push(eq(questionsTable.topic_id, input.topic_id));
    }

    if (input.question_types && input.question_types.length > 0) {
      conditions.push(inArray(questionsTable.type, input.question_types));
    }

    // Build and execute the query for available questions
    const baseQuery = db.select()
      .from(questionsTable);

    // Build the complete query with all conditions
    const selectedQuestions = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(sql`RANDOM()`) // PostgreSQL random ordering
          .limit(input.question_count)
          .execute()
      : await baseQuery
          .orderBy(sql`RANDOM()`) // PostgreSQL random ordering
          .limit(input.question_count)
          .execute();

    // Check if we have enough questions
    if (selectedQuestions.length === 0) {
      throw new Error('No questions found matching the specified criteria');
    }

    if (selectedQuestions.length < input.question_count) {
      console.warn(`Requested ${input.question_count} questions but only found ${selectedQuestions.length} matching criteria`);
    }

    // Create the quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: input.title,
        description: input.description || null
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create quiz-question associations with order indices
    const quizQuestionValues = selectedQuestions.map((question, index) => ({
      quiz_id: quiz.id,
      question_id: question.id,
      order_index: index + 1 // Start ordering from 1
    }));

    await db.insert(quizQuestionsTable)
      .values(quizQuestionValues)
      .execute();

    // Return the quiz with questions
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      created_at: quiz.created_at,
      questions: selectedQuestions
    };

  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
};
