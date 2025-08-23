import { db } from '../db';
import { galleryImagesTable } from '../db/schema';
import { type GalleryImage } from '../schema';

export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  try {
    const results = await db.select()
      .from(galleryImagesTable)
      .orderBy(galleryImagesTable.order_index)
      .execute();

    return results.map(image => ({
      ...image,
      created_at: image.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch gallery images:', error);
    throw error;
  }
};
