import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';

/**
 * Handler for fetching all questions from the database.
 * Returns an array of Question objects.
 */
export const getQuestions = async (): Promise<Question[]> => {
  try {
    const results = await db.select().from(questionsTable).execute();
    // Drizzle returns proper types: id as number, created_at as Date, etc.
    return results;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
};
