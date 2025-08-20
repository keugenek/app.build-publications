import { db } from '../db';
import { instructorsTable } from '../db/schema';
import { type UpdateInstructorInput, type Instructor } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInstructor = async (input: UpdateInstructorInput): Promise<Instructor> => {
  try {
    // Verify instructor exists first
    const existingInstructor = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, input.id))
      .execute();

    if (existingInstructor.length === 0) {
      throw new Error(`Instructor with id ${input.id} not found`);
    }

    // Build update data object with only provided fields
    const updateData: Partial<typeof instructorsTable.$inferInsert> = {};
    
    if (input.specialization !== undefined) {
      updateData.specialization = input.specialization;
    }
    
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return existingInstructor[0];
    }

    // Update instructor record
    const result = await db.update(instructorsTable)
      .set(updateData)
      .where(eq(instructorsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Instructor update failed:', error);
    throw error;
  }
};
