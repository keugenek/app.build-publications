import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type CreateQuizInput, type Quiz } from '../schema';

export const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  try {
    // Insert quiz record
    const result = await db.insert(quizzesTable)
      .values({
        title: input.title,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Quiz creation failed:', error);
    throw error;
  }
};
