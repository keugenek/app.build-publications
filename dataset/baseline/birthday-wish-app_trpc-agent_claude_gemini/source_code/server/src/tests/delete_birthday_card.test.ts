import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteBirthdayCard } from '../handlers/delete_birthday_card';

describe('deleteBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing birthday card', async () => {
    // Create a test birthday card
    const [card] = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'John Doe',
        message: 'Happy Birthday!'
      })
      .returning()
      .execute();

    // Delete the card
    const result = await deleteBirthdayCard(card.id);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the card is actually deleted from database
    const remainingCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, card.id))
      .execute();

    expect(remainingCards).toHaveLength(0);
  });

  it('should return false when deleting non-existent card', async () => {
    // Try to delete a card that doesn't exist
    const result = await deleteBirthdayCard(999);

    // Should return false indicating no card was deleted
    expect(result).toBe(false);
  });

  it('should cascade delete associated photos', async () => {
    // Create a test birthday card
    const [card] = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Jane Smith',
        message: 'Have a wonderful birthday!'
      })
      .returning()
      .execute();

    // Add some photos to the card
    await db.insert(photosTable)
      .values([
        {
          card_id: card.id,
          filename: 'photo1.jpg',
          original_name: 'birthday_photo1.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          caption: 'Birthday party photo',
          display_order: 1
        },
        {
          card_id: card.id,
          filename: 'photo2.jpg',
          original_name: 'birthday_photo2.jpg',
          file_size: 2048,
          mime_type: 'image/jpeg',
          caption: 'Cake cutting moment',
          display_order: 2
        }
      ])
      .execute();

    // Verify photos exist before deletion
    const photosBeforeDeletion = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, card.id))
      .execute();

    expect(photosBeforeDeletion).toHaveLength(2);

    // Delete the card
    const result = await deleteBirthdayCard(card.id);

    // Should return true
    expect(result).toBe(true);

    // Verify card is deleted
    const remainingCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, card.id))
      .execute();

    expect(remainingCards).toHaveLength(0);

    // Verify associated photos are also deleted due to cascade
    const remainingPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, card.id))
      .execute();

    expect(remainingPhotos).toHaveLength(0);
  });

  it('should not affect other birthday cards when deleting one', async () => {
    // Create multiple birthday cards
    const cards = await db.insert(birthdayCardsTable)
      .values([
        {
          recipient_name: 'Alice',
          message: 'Happy Birthday Alice!'
        },
        {
          recipient_name: 'Bob',
          message: 'Happy Birthday Bob!'
        },
        {
          recipient_name: 'Charlie',
          message: 'Happy Birthday Charlie!'
        }
      ])
      .returning()
      .execute();

    expect(cards).toHaveLength(3);

    // Delete the middle card
    const result = await deleteBirthdayCard(cards[1].id);

    expect(result).toBe(true);

    // Verify only the targeted card was deleted
    const remainingCards = await db.select()
      .from(birthdayCardsTable)
      .execute();

    expect(remainingCards).toHaveLength(2);

    // Verify the correct cards remain
    const remainingNames = remainingCards.map(card => card.recipient_name).sort();
    expect(remainingNames).toEqual(['Alice', 'Charlie']);

    // Verify the deleted card is gone
    const deletedCard = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cards[1].id))
      .execute();

    expect(deletedCard).toHaveLength(0);
  });

  it('should handle multiple deletion attempts gracefully', async () => {
    // Create a test birthday card
    const [card] = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test User',
        message: 'Test Message'
      })
      .returning()
      .execute();

    // First deletion should succeed
    const firstResult = await deleteBirthdayCard(card.id);
    expect(firstResult).toBe(true);

    // Second deletion of same card should return false
    const secondResult = await deleteBirthdayCard(card.id);
    expect(secondResult).toBe(false);

    // Third deletion should also return false
    const thirdResult = await deleteBirthdayCard(card.id);
    expect(thirdResult).toBe(false);
  });
});
