import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type DeleteQuestionInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteQuestion = async (input: DeleteQuestionInput): Promise<void> => {
  try {
    await db.delete(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Question deletion failed:', error);
    throw error;
  }
};
