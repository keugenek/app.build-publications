import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type Topic, type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTopicsBySubject(input: GetByIdInput): Promise<Topic[]> {
  try {
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, input.id))
      .execute();

    return topics;
  } catch (error) {
    console.error('Failed to fetch topics by subject:', error);
    throw error;
  }
}
