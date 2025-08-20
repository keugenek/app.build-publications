import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type CreateSubjectInput, type Subject } from '../schema';

export const createSubject = async (input: CreateSubjectInput): Promise<Subject> => {
  try {
    // Insert subject record
    const result = await db.insert(subjectsTable)
      .values({
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    // Return the created subject
    const subject = result[0];
    return {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      created_at: subject.created_at
    };
  } catch (error) {
    console.error('Subject creation failed:', error);
    throw error;
  }
};
