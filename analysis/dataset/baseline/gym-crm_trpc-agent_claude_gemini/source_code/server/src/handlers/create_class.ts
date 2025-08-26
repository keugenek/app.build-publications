import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        class_type: input.class_type,
        instructor_name: input.instructor_name,
        max_capacity: input.max_capacity,
        duration_minutes: input.duration_minutes,
        price: input.price.toString(), // Convert number to string for numeric column
        is_active: true // Default value from schema
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const classData = result[0];
    return {
      ...classData,
      price: parseFloat(classData.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
