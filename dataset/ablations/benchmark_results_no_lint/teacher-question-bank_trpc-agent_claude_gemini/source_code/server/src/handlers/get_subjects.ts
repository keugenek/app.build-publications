import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type Subject } from '../schema';
import { desc } from 'drizzle-orm';

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const results = await db.select()
      .from(subjectsTable)
      .orderBy(desc(subjectsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get subjects:', error);
    throw error;
  }
};
