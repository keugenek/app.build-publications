import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type Subject } from '../schema';

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const result = await db.select()
      .from(subjectsTable)
      .execute();
    
    return result.map(subject => ({
      ...subject,
      created_at: new Date(subject.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    throw error;
  }
};
