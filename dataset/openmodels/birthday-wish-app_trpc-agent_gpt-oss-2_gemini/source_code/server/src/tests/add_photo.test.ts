import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { cards, photos } from '../db/schema';
import { addPhoto, getPhotosByCard } from '../handlers/add_photo';
import { eq } from 'drizzle-orm';

// Helper to create a card for photo foreign key
const createTestCard = async () => {
  const result = await db
    .insert(cards)
    .values({
      name: 'Test Card',
      message: 'Happy Birthday!',
      animation_type: 'confetti',
    })
    .returning()
    .execute();
  return result[0];
};

describe('Photo handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a photo to a card', async () => {
    const card = await createTestCard();
    const input = {
      card_id: card.id,
      url: 'https://example.com/photo.jpg',
      caption: 'A nice photo',
    };

    const photo = await addPhoto(input);

    expect(photo.id).toBeDefined();
    expect(photo.card_id).toBe(card.id);
    expect(photo.url).toBe(input.url);
    expect(photo.caption).toBe(input.caption);

    // Verify persisted in DB
    const rows = await db.select().from(photos).where(eq(photos.id, photo.id)).execute();
    expect(rows).toHaveLength(1);
    const dbPhoto = rows[0];
    expect(dbPhoto.card_id).toBe(card.id);
    expect(dbPhoto.url).toBe(input.url);
    expect(dbPhoto.caption).toBe(input.caption);
  });

  it('should retrieve photos by card id', async () => {
    const card = await createTestCard();
    // Insert two photos directly
    await db
      .insert(photos)
      .values([
        { card_id: card.id, url: 'https://example.com/1.jpg', caption: 'First' },
        { card_id: card.id, url: 'https://example.com/2.jpg', caption: null },
      ])
      .execute();

    const photosResult = await getPhotosByCard(card.id);
    expect(photosResult).toHaveLength(2);
    const urls = photosResult.map(p => p.url).sort();
    expect(urls).toEqual(['https://example.com/1.jpg', 'https://example.com/2.jpg'].sort());
    // Ensure caption null is preserved
    const photoWithNull = photosResult.find(p => p.caption === null);
    expect(photoWithNull).toBeDefined();
  });
});
