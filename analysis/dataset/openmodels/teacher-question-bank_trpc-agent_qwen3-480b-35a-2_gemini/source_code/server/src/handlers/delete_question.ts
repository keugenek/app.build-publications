import { db } from '../db';
import { questionsTable, quizQuestionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteQuestion = async (id: number): Promise<boolean> => {
  try {
    // First delete any quiz_question associations
    await db.delete(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, id))
      .execute();
    
    // Then delete the question itself
    const result = await db.delete(questionsTable)
      .where(eq(questionsTable.id, id))
      .returning()
      .execute();
    
    // Return true if a question was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Question deletion failed:', error);
    throw error;
  }
};
