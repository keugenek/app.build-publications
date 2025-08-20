import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type Topic } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTopics(): Promise<Topic[]> {
  try {
    const results = await db.select()
      .from(topicsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    throw error;
  }
}

export async function getTopicsBySubject(subjectId: number): Promise<Topic[]> {
  try {
    const results = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch topics by subject:', error);
    throw error;
  }
}
