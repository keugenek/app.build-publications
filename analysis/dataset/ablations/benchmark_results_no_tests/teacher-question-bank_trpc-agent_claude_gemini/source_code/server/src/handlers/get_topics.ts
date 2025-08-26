import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type Topic } from '../schema';
import { eq } from 'drizzle-orm';

export const getTopics = async (subjectId?: number): Promise<Topic[]> => {
  try {
    // Build query conditionally based on subjectId parameter
    const query = subjectId !== undefined
      ? db.select().from(topicsTable).where(eq(topicsTable.subject_id, subjectId))
      : db.select().from(topicsTable);

    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    throw error;
  }
};
