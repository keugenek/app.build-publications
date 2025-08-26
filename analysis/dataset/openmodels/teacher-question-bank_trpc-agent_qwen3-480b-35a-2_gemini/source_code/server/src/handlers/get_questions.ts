import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';

export const getQuestions = async (): Promise<Question[]> => {
  try {
    const results = await db.select()
      .from(questionsTable)
      .execute();
    
    // Map results to ensure proper type conversion
    return results.map(question => ({
      ...question,
      created_at: new Date(question.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
};
