import { db } from '../db';
import { questionsTable, quizQuestionsTable } from '../db/schema';
import { type DeleteQuestionInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteQuestion(input: DeleteQuestionInput): Promise<{ success: boolean }> {
  try {
    // First, remove the question from any existing quizzes (quiz_questions junction table)
    await db.delete(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, input.id))
      .execute();

    // Then delete the question itself
    const result = await db.delete(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a question was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Question deletion failed:', error);
    throw error;
  }
}
