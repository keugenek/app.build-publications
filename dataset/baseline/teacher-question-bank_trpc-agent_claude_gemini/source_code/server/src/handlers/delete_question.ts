import { db } from '../db';
import { questionsTable, quizQuestionsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteQuestion(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the question by ID
    // The quiz-question associations will be automatically deleted due to CASCADE constraint
    const result = await db.delete(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether any rows were affected
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Question deletion failed:', error);
    throw error;
  }
}
