import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type Subject } from '../schema';

export async function getSubjects(): Promise<Subject[]> {
  try {
    const results = await db.select()
      .from(subjectsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    throw error;
  }
}
