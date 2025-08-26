import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type Quiz } from '../schema';

export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    const results = await db.select()
      .from(quizzesTable)
      .execute();
    
    return results.map(quiz => ({
      ...quiz,
      created_at: new Date(quiz.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    throw error;
  }
};
