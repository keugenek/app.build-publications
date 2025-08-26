import { db } from '../db';
import { galleryImagesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteGalleryImage(imageId: number): Promise<boolean> {
  try {
    // Delete the image record from the gallery_images table
    const result = await db.delete(galleryImagesTable)
      .where(eq(galleryImagesTable.id, imageId))
      .execute();

    // Return true if a record was deleted, false if no record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Gallery image deletion failed:', error);
    throw error;
  }
}
