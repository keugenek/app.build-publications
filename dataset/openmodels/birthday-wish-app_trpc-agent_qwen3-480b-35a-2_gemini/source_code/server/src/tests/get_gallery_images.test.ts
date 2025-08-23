import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { galleryImagesTable } from '../db/schema';
import { getGalleryImages } from '../handlers/get_gallery_images';

const testImages = [
  {
    title: 'Image 1',
    url: 'https://example.com/image1.jpg',
    order_index: 2
  },
  {
    title: 'Image 2',
    url: 'https://example.com/image2.jpg',
    order_index: 1
  },
  {
    title: 'Image 3',
    url: 'https://example.com/image3.jpg',
    order_index: 3
  }
];

describe('getGalleryImages', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test images
    await db.insert(galleryImagesTable).values(testImages).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all gallery images ordered by order_index', async () => {
    const images = await getGalleryImages();

    expect(images).toHaveLength(3);
    
    // Check if images are ordered by order_index
    expect(images[0].title).toEqual('Image 2');
    expect(images[1].title).toEqual('Image 1');
    expect(images[2].title).toEqual('Image 3');
    
    // Check that all properties are correctly returned
    images.forEach(image => {
      expect(image.id).toBeDefined();
      expect(image.title).toBeDefined();
      expect(image.url).toBeDefined();
      expect(image.order_index).toBeDefined();
      expect(image.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return an empty array when no images exist', async () => {
    // Clear the table
    await db.delete(galleryImagesTable).execute();
    
    const images = await getGalleryImages();
    
    expect(images).toHaveLength(0);
  });
});
