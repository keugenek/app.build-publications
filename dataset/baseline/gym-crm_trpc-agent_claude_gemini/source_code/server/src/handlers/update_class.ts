import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // Build the update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    // Only include fields that are provided in the input
    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    if (input.description !== undefined) {
      updateData['description'] = input.description;
    }
    if (input.class_type !== undefined) {
      updateData['class_type'] = input.class_type;
    }
    if (input.instructor_name !== undefined) {
      updateData['instructor_name'] = input.instructor_name;
    }
    if (input.max_capacity !== undefined) {
      updateData['max_capacity'] = input.max_capacity;
    }
    if (input.duration_minutes !== undefined) {
      updateData['duration_minutes'] = input.duration_minutes;
    }
    if (input.price !== undefined) {
      updateData['price'] = input.price.toString(); // Convert number to string for numeric column
    }
    if (input.is_active !== undefined) {
      updateData['is_active'] = input.is_active;
    }

    // Update class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    // Check if class was found and updated
    if (result.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const updatedClass = result[0];
    return {
      ...updatedClass,
      price: parseFloat(updatedClass.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};
