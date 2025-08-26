import { type CreateClassInput, type Class } from '../schema';
import { db } from '../db';
import { classesTable } from '../db/schema';

// Handler for creating a class: inserts into the database and returns the created record
export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Insert class record into the database and return the inserted row
    const result = await db
      .insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        trainer: input.trainer,
        capacity: input.capacity,
        date: input.date.toISOString().split('T')[0],
        time: input.time,
      })
      .returning()
      .execute();

    // Drizzle returns an array; the inserted record is the first element
    const raw = result[0] as any;
    // Convert date string to Date object and trim time to HH:mm
    const classRecord: Class = {
      ...raw,
      date: new Date(raw.date),
      time: raw.time.slice(0, 5), // remove seconds if present
    };
    return classRecord;
  } catch (error) {
    console.error('Failed to create class:', error);
    throw error;
  }
};
