import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type Quiz } from '../schema';
import { desc } from 'drizzle-orm';

export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    // Fetch all quizzes ordered by creation date (newest first)
    const results = await db.select()
      .from(quizzesTable)
      .orderBy(desc(quizzesTable.created_at))
      .execute();

    // Return the quiz data (no numeric field conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    throw error;
  }
};
