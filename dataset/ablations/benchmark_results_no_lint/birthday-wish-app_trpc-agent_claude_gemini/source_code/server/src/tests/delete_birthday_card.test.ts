import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { deleteBirthdayCard } from '../handlers/delete_birthday_card';
import { eq } from 'drizzle-orm';

describe('deleteBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing birthday card and return true', async () => {
    // Create a test birthday card
    const cardData = {
      recipient_name: 'John Doe',
      message: 'Happy Birthday!',
      sender_name: 'Jane Smith',
      theme: 'confetti' as const
    };

    const [createdCard] = await db.insert(birthdayCardsTable)
      .values(cardData)
      .returning()
      .execute();

    // Delete the card
    const result = await deleteBirthdayCard(createdCard.id);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the card no longer exists in the database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, createdCard.id))
      .execute();

    expect(cards).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent card', async () => {
    // Try to delete a card that doesn't exist
    const result = await deleteBirthdayCard(999);

    // Should return false indicating no deletion occurred
    expect(result).toBe(false);
  });

  it('should cascade delete associated photos when deleting a card', async () => {
    // Create a test birthday card
    const cardData = {
      recipient_name: 'Alice Johnson',
      message: 'Hope your day is amazing!',
      sender_name: 'Bob Wilson',
      theme: 'balloons' as const
    };

    const [createdCard] = await db.insert(birthdayCardsTable)
      .values(cardData)
      .returning()
      .execute();

    // Add some photos to the card
    const photoData = [
      {
        card_id: createdCard.id,
        image_url: 'https://example.com/photo1.jpg',
        caption: 'Photo 1',
        display_order: 1
      },
      {
        card_id: createdCard.id,
        image_url: 'https://example.com/photo2.jpg',
        caption: 'Photo 2',
        display_order: 2
      }
    ];

    await db.insert(photosTable)
      .values(photoData)
      .execute();

    // Verify photos exist before deletion
    const photosBeforeDeletion = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, createdCard.id))
      .execute();

    expect(photosBeforeDeletion).toHaveLength(2);

    // Delete the card
    const result = await deleteBirthdayCard(createdCard.id);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the card no longer exists
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, createdCard.id))
      .execute();

    expect(cards).toHaveLength(0);

    // Verify associated photos were also deleted (cascade delete)
    const photosAfterDeletion = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, createdCard.id))
      .execute();

    expect(photosAfterDeletion).toHaveLength(0);
  });

  it('should only delete the specified card when multiple cards exist', async () => {
    // Create multiple test birthday cards
    const cardsData = [
      {
        recipient_name: 'Card One',
        message: 'Message One',
        sender_name: 'Sender One',
        theme: 'confetti' as const
      },
      {
        recipient_name: 'Card Two',
        message: 'Message Two',
        sender_name: 'Sender Two',
        theme: 'sparkles' as const
      },
      {
        recipient_name: 'Card Three',
        message: 'Message Three',
        sender_name: 'Sender Three',
        theme: 'balloons' as const
      }
    ];

    const createdCards = await db.insert(birthdayCardsTable)
      .values(cardsData)
      .returning()
      .execute();

    expect(createdCards).toHaveLength(3);

    // Delete the middle card
    const cardToDelete = createdCards[1];
    const result = await deleteBirthdayCard(cardToDelete.id);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the specific card was deleted
    const deletedCard = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cardToDelete.id))
      .execute();

    expect(deletedCard).toHaveLength(0);

    // Verify other cards still exist
    const remainingCards = await db.select()
      .from(birthdayCardsTable)
      .execute();

    expect(remainingCards).toHaveLength(2);
    expect(remainingCards.map(card => card.recipient_name)).toContain('Card One');
    expect(remainingCards.map(card => card.recipient_name)).toContain('Card Three');
    expect(remainingCards.map(card => card.recipient_name)).not.toContain('Card Two');
  });

  it('should handle deletion with invalid ID gracefully', async () => {
    // Try to delete with negative ID
    const result1 = await deleteBirthdayCard(-1);
    expect(result1).toBe(false);

    // Try to delete with zero ID
    const result2 = await deleteBirthdayCard(0);
    expect(result2).toBe(false);
  });
});
