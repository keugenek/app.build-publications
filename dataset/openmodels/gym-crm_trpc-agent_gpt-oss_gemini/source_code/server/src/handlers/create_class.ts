import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';

/**
 * Handler for creating a new gym class.
 * Inserts the class into the database and returns the created record.
 */
export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    const result = await db
      .insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        start_time: input.start_time,
        end_time: input.end_time,
        capacity: input.capacity,
      })
      .returning()
      .execute();

    // Drizzle returns an array of inserted rows; return the first one
    const classRecord = result[0];
    return classRecord as Class;
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
