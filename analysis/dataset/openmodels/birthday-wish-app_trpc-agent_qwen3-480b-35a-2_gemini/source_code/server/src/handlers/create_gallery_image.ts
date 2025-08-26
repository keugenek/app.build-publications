import { db } from '../db';
import { galleryImagesTable } from '../db/schema';
import { type CreateGalleryImageInput, type GalleryImage } from '../schema';

export const createGalleryImage = async (input: CreateGalleryImageInput): Promise<GalleryImage> => {
  try {
    // Insert gallery image record
    const result = await db.insert(galleryImagesTable)
      .values({
        title: input.title,
        url: input.url,
        order_index: input.order_index
      })
      .returning()
      .execute();

    // Return the created gallery image
    const galleryImage = result[0];
    return {
      ...galleryImage,
      created_at: new Date(galleryImage.created_at)
    };
  } catch (error) {
    console.error('Gallery image creation failed:', error);
    throw error;
  }
};
