import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';

/**
 * Fetch all gym classes from the database.
 * Returns an array of {@link Class} objects.
 */
export const getClasses = async (): Promise<Class[]> => {
  try {
    // Select all rows from the classes table
    const rows = await db.select().from(classesTable).execute();

    // The rows already match the `Class` shape, but we map explicitly for clarity
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      capacity: row.capacity,
      instructor: row.instructor,
      scheduled_at: row.scheduled_at,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
