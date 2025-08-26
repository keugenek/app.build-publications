import { type UpdateClassInput, type Class } from '../schema';

import { db } from '../db';
import { eq } from 'drizzle-orm';
import { classesTable } from '../db/schema';
import type { NewClass } from '../db/schema';

// Real implementation updates the class record in the database and returns the updated class
export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  // Build an object with only the fields that are provided
  const updateData: Partial<NewClass> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.capacity !== undefined) updateData.capacity = input.capacity;
  if (input.instructor !== undefined) updateData.instructor = input.instructor;
  if (input.scheduled_at !== undefined) updateData.scheduled_at = input.scheduled_at;

  try {
    const result = await db
      .update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    // Drizzle returns the row with proper types (dates are Date objects)
    return result[0] as Class;
  } catch (error) {
    console.error('Update class failed:', error);
    throw error;
  }
};
