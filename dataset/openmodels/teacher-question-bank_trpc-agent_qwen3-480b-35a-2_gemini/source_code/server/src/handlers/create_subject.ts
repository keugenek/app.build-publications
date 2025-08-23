import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput, type Subject } from '../schema';

export const createSubject = async (input: CreateSubjectInput): Promise<Subject> => {
  try {
    // Insert subject record
    const result = await db.insert(subjectsTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    // Return the created subject
    return result[0];
  } catch (error) {
    console.error('Subject creation failed:', error);
    throw error;
  }
};
