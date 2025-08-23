import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // Build the update data object with only the provided fields
    const updateData: Partial<typeof classesTable.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes;
    if (input.instructor_id !== undefined) updateData.instructor_id = input.instructor_id;
    if (input.capacity !== undefined) updateData.capacity = input.capacity;

    // Update the class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    // Return the updated class
    return result[0] as Class;
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};
