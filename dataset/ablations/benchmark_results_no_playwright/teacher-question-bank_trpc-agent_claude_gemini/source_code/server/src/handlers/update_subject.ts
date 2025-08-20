import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type UpdateSubjectInput, type Subject } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSubject = async (input: UpdateSubjectInput): Promise<Subject> => {
  try {
    // Build the update values object, only including fields that are provided
    const updateValues: { name?: string } = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }

    // If no fields to update, just return the existing subject
    if (Object.keys(updateValues).length === 0) {
      const existingSubject = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, input.id))
        .execute();

      if (existingSubject.length === 0) {
        throw new Error(`Subject with id ${input.id} not found`);
      }

      return existingSubject[0];
    }

    // Update the subject record
    const result = await db.update(subjectsTable)
      .set(updateValues)
      .where(eq(subjectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Subject with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Subject update failed:', error);
    throw error;
  }
};
