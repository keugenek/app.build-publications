import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type Topic } from '../schema';

export const getTopics = async (): Promise<Topic[]> => {
  try {
    const results = await db.select()
      .from(topicsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get topics:', error);
    throw error;
  }
};
