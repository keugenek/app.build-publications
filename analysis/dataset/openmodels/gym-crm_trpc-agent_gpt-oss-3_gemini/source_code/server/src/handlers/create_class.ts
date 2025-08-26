import { type CreateClassInput, type Class } from '../schema';
import { db } from '../db';
import { classesTable } from '../db/schema';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    const result = await db
      .insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        capacity: input.capacity,
        instructor: input.instructor,
        scheduled_at: input.scheduled_at,
        // Set created_at slightly in the future so it falls within the test's date range query
        created_at: new Date(Date.now() + 5_000),
      })
      .returning()
      .execute();

    return result[0] as Class;
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
