import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';
// import { eq } from 'drizzle-orm';

/**
 * Handler for creating a question.
 * Inserts the provided data into the `questions` table and returns the newly created record.
 */
export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    // Insert the new question and return the inserted row (including generated id & timestamps)
    const result = await db
      .insert(questionsTable)
      .values({
        subject: input.subject,
        topic: input.topic,
        question_text: input.question_text,
        answer_text: input.answer_text,
      })
      .returning()
      .execute();

    // Drizzle returns an array of inserted rows; we expect exactly one.
    const question = result[0];
    return question;
  } catch (error) {
    console.error('Failed to create question:', error);
    throw error;
  }
};
