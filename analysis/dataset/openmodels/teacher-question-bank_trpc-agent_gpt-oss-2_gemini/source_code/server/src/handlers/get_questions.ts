import { type Question } from '../schema';
import { db } from '../db';
import { questionsTable } from '../db/schema';

/**
 * Placeholder handler for fetching all questions.
 * Real implementation would query the DB.
 */
export const getQuestions = async (): Promise<Question[]> => {
  // Query all questions from the database
  const rows = await db.select().from(questionsTable).execute();
  // Drizzle returns rows in the correct shape; ensure Date objects for timestamps
  return rows.map(row => ({
    ...row,
    // No numeric conversion needed for this schema
  }));
};
