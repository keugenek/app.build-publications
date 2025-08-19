import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GetByIdInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const getQuestionById = async (input: GetByIdInput): Promise<Question> => {
  try {
    const result = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Question with ID ${input.id} not found`);
    }

    const question = result[0];
    return {
      ...question,
      // Ensure dates are properly converted to Date objects
      created_at: question.created_at,
      updated_at: question.updated_at
    };
  } catch (error) {
    console.error('Failed to get question by ID:', error);
    throw error;
  }
};
