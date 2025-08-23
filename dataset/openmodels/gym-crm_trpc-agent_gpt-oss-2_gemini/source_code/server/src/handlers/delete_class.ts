import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteClassInput, type Class } from '../schema';

/**
 * Deletes a class by its ID and returns the deleted record.
 * Throws an error if the class does not exist.
 */
export const deleteClass = async (input: DeleteClassInput): Promise<Class> => {
  try {
    const deleted = await db
      .delete(classesTable)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    if (deleted.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    // Drizzle returns an array of deleted rows; return the first one
    const cls = deleted[0];
    // Normalize time format to HH:mm (strip seconds if present)
    const normalizedTime = typeof cls.time === 'string' && cls.time.length > 5 ? cls.time.slice(0,5) : cls.time;
    const dateObj = typeof cls.date === 'string' ? new Date(cls.date) : cls.date;
    return { ...cls, date: dateObj, time: normalizedTime } as Class;
  } catch (error) {
    console.error('Failed to delete class:', error);
    throw error;
  }
};
