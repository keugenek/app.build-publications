import { db } from '../db';
import { photosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdatePhotoInput, type Photo } from '../schema';

export const updatePhoto = async (input: UpdatePhotoInput): Promise<Photo | null> => {
  try {
    // Check if photo exists
    const existingPhoto = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, input.id))
      .execute();

    if (existingPhoto.length === 0) {
      return null;
    }

    // Build update values object with only provided fields
    const updateValues: Record<string, any> = {};
    
    if (input.caption !== undefined) {
      updateValues['caption'] = input.caption;
    }
    
    if (input.display_order !== undefined) {
      updateValues['display_order'] = input.display_order;
    }

    // If no fields to update, return the existing photo
    if (Object.keys(updateValues).length === 0) {
      return existingPhoto[0];
    }

    // Update the photo record
    const result = await db.update(photosTable)
      .set(updateValues)
      .where(eq(photosTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Photo update failed:', error);
    throw error;
  }
};
