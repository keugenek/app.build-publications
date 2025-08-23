import { db } from '../db';
import { photosTable } from '../db/schema';
import { type Photo } from '../schema';

/**
 * Fetch all photos in the gallery.
 * Returns an array of Photo objects ordered by the `order` column.
 */
export const getPhotos = async (): Promise<Photo[]> => {
  try {
    // Base query – select all columns from the photos table
    const results = await db.select().from(photosTable).orderBy(photosTable.order).execute();
    // No numeric conversions required (order is integer, id is serial)
    // Ensure we return a plain array of Photo objects
    return results.map((photo) => ({
      ...photo,
    }));
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    throw error;
  }
};
