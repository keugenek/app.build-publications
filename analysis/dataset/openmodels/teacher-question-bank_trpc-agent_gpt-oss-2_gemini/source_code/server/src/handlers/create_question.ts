import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';

/**
 * Handler to create a new question in the database.
 * Returns the inserted question with generated `id` and `created_at`.
 */
export const createQuestion = async (
  input: CreateQuestionInput,
): Promise<Question> => {
  try {
    const result = await db
      .insert(questionsTable)
      .values({
        subject: input.subject,
        topic: input.topic,
        content: input.content,
      })
      .returning()
      .execute();

    const question = result[0];
    // Drizzle returns `created_at` as a Date already, so we can return directly
    return question as Question;
  } catch (error) {
    console.error('Failed to create question:', error);
    throw error;
  }
};
