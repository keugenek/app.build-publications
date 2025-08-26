import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type Topic } from '../schema';

export async function getTopics(): Promise<Topic[]> {
  try {
    // Fetch all topics from the database
    const result = await db.select()
      .from(topicsTable)
      .orderBy(topicsTable.created_at)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    throw error;
  }
}
