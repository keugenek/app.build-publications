import { db } from '../db';
import { photosTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePhoto = async (photoId: number): Promise<boolean> => {
  try {
    // Delete photo record from database
    const result = await db.delete(photosTable)
      .where(eq(photosTable.id, photoId))
      .execute();

    // Check if any rows were affected (photo existed and was deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Photo deletion failed:', error);
    throw error;
  }
};
