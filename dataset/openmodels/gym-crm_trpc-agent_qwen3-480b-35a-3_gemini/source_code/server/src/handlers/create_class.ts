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
        date: input.date,
        duration_minutes: input.duration_minutes,
        instructor_id: input.instructor_id,
        capacity: input.capacity
      })
      .returning()
      .execute();

    const createdClass = result[0];
    return {
      ...createdClass,
      date: new Date(createdClass.date), // Ensure proper date conversion
      created_at: new Date(createdClass.created_at) // Ensure proper date conversion
    };
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
