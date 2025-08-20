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
        instructor_name: input.instructor_name,
        duration_minutes: input.duration_minutes,
        max_capacity: input.max_capacity,
        class_type: input.class_type,
        difficulty_level: input.difficulty_level
      })
      .returning()
      .execute();

    const newClass = result[0];
    return newClass;
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
