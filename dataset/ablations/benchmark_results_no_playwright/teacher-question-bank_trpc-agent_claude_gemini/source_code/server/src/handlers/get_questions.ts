import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';

export async function getQuestions(): Promise<Question[]> {
  try {
    const results = await db.select()
      .from(questionsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
}
