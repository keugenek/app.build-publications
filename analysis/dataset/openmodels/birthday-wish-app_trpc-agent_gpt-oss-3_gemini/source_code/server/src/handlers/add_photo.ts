import { db } from '../db';
import { photosTable } from '../db/schema';
import { type AddPhotoInput, type Photo as SchemaPhoto } from '../schema';
import { type Photo as DBPhoto } from '../db/schema';

/**
 * Handler to add a new photo to the gallery.
 * Inserts the photo into the database and returns the created record.
 */
export const addPhoto = async (input: AddPhotoInput): Promise<SchemaPhoto> => {
  try {
    const result = await db
      .insert(photosTable)
      .values({
        url: input.url,
        caption: input.caption ?? null,
        order: input.order,
      })
      .returning()
      .execute();
    // result is an array with the inserted row
    const photo = result[0] as DBPhoto;
    // Drizzle returns Date objects for timestamp columns, no conversion needed
    return {
  id: photo.id,
  url: photo.url,
  caption: photo.caption ?? null,
  order: photo.order,
  created_at: photo.created_at,
} as SchemaPhoto;
  } catch (error) {
    console.error('Failed to add photo:', error);
    throw error;
  }
};
