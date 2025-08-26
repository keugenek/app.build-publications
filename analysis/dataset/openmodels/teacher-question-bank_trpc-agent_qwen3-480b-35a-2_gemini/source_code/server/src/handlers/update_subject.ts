import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type UpdateSubjectInput, type Subject } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSubject = async (input: UpdateSubjectInput): Promise<Subject> => {
  try {
    // Build the update data object dynamically based on provided fields
    const updateData: { name?: string } = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // Update the subject record
    const result = await db.update(subjectsTable)
      .set(updateData)
      .where(eq(subjectsTable.id, input.id))
      .returning()
      .execute();

    // Check if a subject was actually updated
    if (result.length === 0) {
      throw new Error(`Subject with id ${input.id} not found`);
    }

    // Return the updated subject
    return result[0];
  } catch (error) {
    console.error('Subject update failed:', error);
    throw error;
  }
};
