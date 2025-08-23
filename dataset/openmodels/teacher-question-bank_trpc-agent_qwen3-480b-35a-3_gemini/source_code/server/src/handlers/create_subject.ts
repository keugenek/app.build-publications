import { type CreateSubjectInput, type Subject } from '../schema';
import { db } from '../db';
import { subjectsTable } from '../db/schema';

export const createSubject = async (input: CreateSubjectInput): Promise<Subject> => {
  try {
    const [newSubject] = await db.insert(subjectsTable)
      .values({
        name: input.name
      })
      .returning();
    
    return newSubject;
  } catch (error) {
    console.error('Subject creation failed:', error);
    throw error;
  }
};
