import { db } from '../db';
import { photosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdatePhotoInput, type Photo } from '../schema';

export const updatePhoto = async (input: UpdatePhotoInput): Promise<Photo | null> => {
  try {
    // Check if photo exists first
    const existingPhoto = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, input.id))
      .execute();

    if (existingPhoto.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof photosTable.$inferInsert> = {};
    
    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }
    
    if (input.caption !== undefined) {
      updateData.caption = input.caption;
    }
    
    if (input.display_order !== undefined) {
      updateData.display_order = input.display_order;
    }

    // If no fields to update, return existing photo
    if (Object.keys(updateData).length === 0) {
      return existingPhoto[0];
    }

    // Update the photo
    const result = await db.update(photosTable)
      .set(updateData)
      .where(eq(photosTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Photo update failed:', error);
    throw error;
  }
};
