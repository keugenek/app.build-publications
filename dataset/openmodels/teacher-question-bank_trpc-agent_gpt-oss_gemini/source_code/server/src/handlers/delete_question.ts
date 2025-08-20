import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type DeleteQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Placeholder handler for deleting a question.
 * Real implementation would remove the question from the database.
 * Returns the deleted question for confirmation (or could return a flag).
 */
export const deleteQuestion = async (input: DeleteQuestionInput): Promise<Question> => {
  try {
    // Fetch the question to return after deletion
    const fetched = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    if (fetched.length === 0) {
      throw new Error(`Question with id ${input.id} not found`);
    }
    const question = fetched[0];

    // Delete the question
    await db.delete(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    // Return the previously fetched record (matches Question type)
    return question as Question;
  } catch (error) {
    console.error('Failed to delete question:', error);
    throw error;
  }
};

