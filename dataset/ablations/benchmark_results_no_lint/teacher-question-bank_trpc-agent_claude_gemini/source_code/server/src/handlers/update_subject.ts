import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { type UpdateSubjectInput, type Subject } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSubject = async (input: UpdateSubjectInput): Promise<Subject> => {
  try {
    // Build the update object with only the fields that are provided
    const updateData: Partial<typeof subjectsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the subject record
    const result = await db.update(subjectsTable)
      .set(updateData)
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
