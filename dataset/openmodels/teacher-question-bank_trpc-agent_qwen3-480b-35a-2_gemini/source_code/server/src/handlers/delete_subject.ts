import { db } from '../db';
import { subjectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteSubject = async (id: number): Promise<boolean> => {
  try {
    // Delete the subject by ID
    const result = await db.delete(subjectsTable)
      .where(eq(subjectsTable.id, id))
      .returning()
      .execute();

    // Return true if a subject was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Subject deletion failed:', error);
    throw error;
  }
};
