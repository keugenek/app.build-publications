import { db } from '../db';
import { topicsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetTopicsBySubjectInput, type Topic } from '../schema';

export const getTopicsBySubject = async (input: GetTopicsBySubjectInput): Promise<Topic[]> => {
  try {
    // Query topics filtered by subject_id
    const results = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, input.subject_id))
      .execute();

    // Return results directly - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch topics by subject:', error);
    throw error;
  }
};
