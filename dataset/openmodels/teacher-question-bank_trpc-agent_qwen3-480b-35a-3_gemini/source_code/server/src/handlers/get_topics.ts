import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type Topic } from '../schema';
import { eq } from 'drizzle-orm';

export const getTopics = async (): Promise<Topic[]> => {
  try {
    const result = await db.select()
      .from(topicsTable)
      .orderBy(topicsTable.name)
      .execute();

    return result.map(topic => ({
      ...topic,
      created_at: new Date(topic.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    throw error;
  }
};

export const getTopicsBySubject = async (subjectId: number): Promise<Topic[]> => {
  try {
    // First verify that the subject exists
    const subjectExists = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, subjectId))
      .execute();

    if (subjectExists.length === 0) {
      throw new Error(`Subject with ID ${subjectId} not found`);
    }

    const result = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .orderBy(topicsTable.name)
      .execute();

    return result.map(topic => ({
      ...topic,
      created_at: new Date(topic.created_at)
    }));
  } catch (error) {
    console.error(`Failed to fetch topics for subject ID ${subjectId}:`, error);
    throw error;
  }
};
