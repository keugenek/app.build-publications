import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Class } from '../schema';

/**
 * Delete a class by its ID and return the deleted class record.
 * Throws an error if the class does not exist.
 */
export const deleteClass = async (id: number): Promise<Class> => {
  try {
    // Fetch the class to return after deletion
    const existing = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, id))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      throw new Error(`Class with id ${id} not found`);
    }

    const cls = existing[0];

    // Delete the record
    await db.delete(classesTable).where(eq(classesTable.id, id)).execute();

    // Return the previously fetched record (matches schema.Class shape)
    return {
      id: cls.id,
      name: cls.name,
      description: cls.description,
      capacity: cls.capacity,
      instructor: cls.instructor,
      scheduled_at: cls.scheduled_at,
      created_at: cls.created_at,
    };
  } catch (error) {
    console.error('Failed to delete class:', error);
    throw error;
  }
};
