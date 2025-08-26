import { type UpdateClassInput, type Class } from '../schema';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { NewClass } from '../db/schema';

/**
 * Placeholder handler for updating a gym class.
 * In real implementation this would perform an UPDATE query.
 */
export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // Build update values based on provided fields
    const updateValues: Partial<NewClass> = {};
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.start_time !== undefined) updateValues.start_time = input.start_time;
    if (input.end_time !== undefined) updateValues.end_time = input.end_time;
    if (input.capacity !== undefined) updateValues.capacity = input.capacity;

    // Perform update query
    const result = await db
      .update(classesTable)
      .set(updateValues)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    // Return the updated class (should be exactly one record)
    return result[0] as Class;
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};

