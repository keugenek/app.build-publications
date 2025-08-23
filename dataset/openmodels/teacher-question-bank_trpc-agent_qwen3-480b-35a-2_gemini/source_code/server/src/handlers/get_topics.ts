import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type Topic } from '../schema';

export const getTopics = async (): Promise<Topic[]> => {
  try {
    const results = await db.select()
      .from(topicsTable)
      .execute();

    // Convert results to proper Topic type
    return results.map(topic => ({
      ...topic,
      created_at: new Date(topic.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    throw error;
  }
};
