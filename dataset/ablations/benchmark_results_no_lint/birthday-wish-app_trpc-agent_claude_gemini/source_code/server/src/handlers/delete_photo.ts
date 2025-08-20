import { db } from '../db';
import { photosTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePhoto = async (id: number): Promise<boolean> => {
  try {
    // Delete the photo record
    const result = await db.delete(photosTable)
      .where(eq(photosTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Photo deletion failed:', error);
    throw error;
  }
};
