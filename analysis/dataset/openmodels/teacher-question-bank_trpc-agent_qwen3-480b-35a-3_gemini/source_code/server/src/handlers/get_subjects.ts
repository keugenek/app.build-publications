import { type Subject } from '../schema';
import { db } from '../db';
import { subjectsTable } from '../db/schema';

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const subjects = await db.select().from(subjectsTable);
    return subjects;
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    throw error;
  }
};
