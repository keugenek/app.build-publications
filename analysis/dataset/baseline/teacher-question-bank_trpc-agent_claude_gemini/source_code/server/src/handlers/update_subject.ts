import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateSubjectInput, type Subject } from '../schema';

export const updateSubject = async (input: UpdateSubjectInput): Promise<Subject> => {
  try {
    // First, check if subject exists
    const existingSubject = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, input.id))
      .execute();

    if (existingSubject.length === 0) {
      throw new Error(`Subject with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // If no fields to update, return existing subject
    if (Object.keys(updateData).length === 0) {
      return existingSubject[0];
    }

    // Update the subject
    const result = await db.update(subjectsTable)
      .set(updateData)
      .where(eq(subjectsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Subject update failed:', error);
    throw error;
  }
};
