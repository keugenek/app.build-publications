import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type UpdateBirthdayCardInput, type CreateBirthdayCardInput } from '../schema';
import { updateBirthdayCard } from '../handlers/update_birthday_card';
import { eq } from 'drizzle-orm';

// Helper function to create a test birthday card
const createTestCard = async (cardData: CreateBirthdayCardInput) => {
  const result = await db.insert(birthdayCardsTable)
    .values({
      recipient_name: cardData.recipient_name,
      message: cardData.message
    })
    .returning()
    .execute();

  return result[0];
};

// Test data
const testCardData: CreateBirthdayCardInput = {
  recipient_name: 'John Doe',
  message: 'Happy Birthday! Hope you have a wonderful day!'
};

describe('updateBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update recipient_name only', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);
    const originalMessage = initialCard.message;
    const originalCreatedAt = initialCard.created_at;

    // Update only the recipient name
    const updateInput: UpdateBirthdayCardInput = {
      id: initialCard.id,
      recipient_name: 'Jane Smith'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify update results
    expect(result).toBeDefined();
    expect(result!.id).toEqual(initialCard.id);
    expect(result!.recipient_name).toEqual('Jane Smith');
    expect(result!.message).toEqual(originalMessage); // Should remain unchanged
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should update message only', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);
    const originalRecipientName = initialCard.recipient_name;
    const originalCreatedAt = initialCard.created_at;

    // Update only the message
    const updateInput: UpdateBirthdayCardInput = {
      id: initialCard.id,
      message: 'Wishing you all the best on your special day!'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify update results
    expect(result).toBeDefined();
    expect(result!.id).toEqual(initialCard.id);
    expect(result!.recipient_name).toEqual(originalRecipientName); // Should remain unchanged
    expect(result!.message).toEqual('Wishing you all the best on your special day!');
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should update both recipient_name and message', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);
    const originalCreatedAt = initialCard.created_at;

    // Update both fields
    const updateInput: UpdateBirthdayCardInput = {
      id: initialCard.id,
      recipient_name: 'Bob Wilson',
      message: 'Another year older, another year wiser!'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify update results
    expect(result).toBeDefined();
    expect(result!.id).toEqual(initialCard.id);
    expect(result!.recipient_name).toEqual('Bob Wilson');
    expect(result!.message).toEqual('Another year older, another year wiser!');
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should persist changes to database', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);

    // Update the card
    const updateInput: UpdateBirthdayCardInput = {
      id: initialCard.id,
      recipient_name: 'Alice Johnson',
      message: 'Hope your birthday is as special as you are!'
    };

    await updateBirthdayCard(updateInput);

    // Verify changes are persisted in database
    const updatedCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, initialCard.id))
      .execute();

    expect(updatedCards).toHaveLength(1);
    const updatedCard = updatedCards[0];
    expect(updatedCard.recipient_name).toEqual('Alice Johnson');
    expect(updatedCard.message).toEqual('Hope your birthday is as special as you are!');
    expect(updatedCard.updated_at).toBeInstanceOf(Date);
    expect(updatedCard.updated_at.getTime()).toBeGreaterThanOrEqual(updatedCard.created_at.getTime());
  });

  it('should return null when card does not exist', async () => {
    // Try to update non-existent card
    const updateInput: UpdateBirthdayCardInput = {
      id: 99999,
      recipient_name: 'Non Existent'
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).toBeNull();
  });

  it('should handle empty field updates gracefully', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);

    // Add a small delay to ensure timestamps differ
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only id (no fields to update except updated_at)
    const updateInput: UpdateBirthdayCardInput = {
      id: initialCard.id
    };

    const result = await updateBirthdayCard(updateInput);

    // Should still update the updated_at timestamp
    expect(result).toBeDefined();
    expect(result!.id).toEqual(initialCard.id);
    expect(result!.recipient_name).toEqual(initialCard.recipient_name);
    expect(result!.message).toEqual(initialCard.message);
    expect(result!.created_at).toEqual(initialCard.created_at);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(initialCard.created_at.getTime());
  });

  it('should maintain data integrity with special characters', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);

    // Update with special characters and emojis
    const updateInput: UpdateBirthdayCardInput = {
      id: initialCard.id,
      recipient_name: 'María José O\'Connor',
      message: '¡Feliz cumpleaños! 🎂🎉 Hope you have an amazing day filled with joy & laughter!'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify special characters are handled properly
    expect(result).toBeDefined();
    expect(result!.recipient_name).toEqual('María José O\'Connor');
    expect(result!.message).toEqual('¡Feliz cumpleaños! 🎂🎉 Hope you have an amazing day filled with joy & laughter!');
  });

  it('should handle concurrent updates correctly', async () => {
    // Create initial card
    const initialCard = await createTestCard(testCardData);

    // Simulate concurrent updates
    const update1: UpdateBirthdayCardInput = {
      id: initialCard.id,
      recipient_name: 'Update 1'
    };

    const update2: UpdateBirthdayCardInput = {
      id: initialCard.id,
      message: 'Update 2 message'
    };

    // Execute updates concurrently
    const [result1, result2] = await Promise.all([
      updateBirthdayCard(update1),
      updateBirthdayCard(update2)
    ]);

    // Both updates should succeed
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();

    // Verify final state in database
    const finalCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, initialCard.id))
      .execute();

    expect(finalCards).toHaveLength(1);
    const finalCard = finalCards[0];
    
    // One of the updates should have taken effect (database handles concurrency)
    expect(finalCard.updated_at).toBeInstanceOf(Date);
    expect(finalCard.updated_at.getTime()).toBeGreaterThan(initialCard.created_at.getTime());
  });
});
