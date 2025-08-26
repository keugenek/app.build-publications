import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type UpdateBirthdayCardInput, type CreateBirthdayCardInput } from '../schema';
import { updateBirthdayCard } from '../handlers/update_birthday_card';
import { eq } from 'drizzle-orm';

// Test data
const testCardInput: CreateBirthdayCardInput = {
  title: 'Happy Birthday!',
  message: 'Wishing you a wonderful day filled with happiness and love!',
  recipient_name: 'John Doe',
  sender_name: 'Jane Smith'
};

describe('updateBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test birthday card
  const createTestCard = async () => {
    const result = await db.insert(birthdayCardsTable)
      .values(testCardInput)
      .returning()
      .execute();
    return result[0];
  };

  it('should update a birthday card with all fields', async () => {
    // Create test card
    const card = await createTestCard();

    const updateInput: UpdateBirthdayCardInput = {
      id: card.id,
      title: 'Updated Birthday Wishes',
      message: 'Updated message with more joy!',
      recipient_name: 'John Updated',
      sender_name: 'Jane Updated',
      is_active: false
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(card.id);
    expect(result!.title).toEqual('Updated Birthday Wishes');
    expect(result!.message).toEqual('Updated message with more joy!');
    expect(result!.recipient_name).toEqual('John Updated');
    expect(result!.sender_name).toEqual('Jane Updated');
    expect(result!.is_active).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update only specific fields', async () => {
    // Create test card
    const card = await createTestCard();

    const updateInput: UpdateBirthdayCardInput = {
      id: card.id,
      title: 'Only Title Updated',
      is_active: false
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(card.id);
    expect(result!.title).toEqual('Only Title Updated');
    expect(result!.message).toEqual(testCardInput.message); // Unchanged
    expect(result!.recipient_name).toEqual(testCardInput.recipient_name); // Unchanged
    expect(result!.sender_name).toEqual(testCardInput.sender_name); // Unchanged
    expect(result!.is_active).toEqual(false);
  });

  it('should save updated data to database', async () => {
    // Create test card
    const card = await createTestCard();

    const updateInput: UpdateBirthdayCardInput = {
      id: card.id,
      title: 'Database Update Test',
      message: 'Testing database persistence'
    };

    await updateBirthdayCard(updateInput);

    // Verify changes were saved to database
    const savedCard = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, card.id))
      .execute();

    expect(savedCard).toHaveLength(1);
    expect(savedCard[0].title).toEqual('Database Update Test');
    expect(savedCard[0].message).toEqual('Testing database persistence');
    expect(savedCard[0].recipient_name).toEqual(testCardInput.recipient_name); // Unchanged
  });

  it('should return existing record when no fields are provided for update', async () => {
    // Create test card
    const card = await createTestCard();

    const updateInput: UpdateBirthdayCardInput = {
      id: card.id
      // No update fields provided
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(card.id);
    expect(result!.title).toEqual(testCardInput.title);
    expect(result!.message).toEqual(testCardInput.message);
    expect(result!.recipient_name).toEqual(testCardInput.recipient_name);
    expect(result!.sender_name).toEqual(testCardInput.sender_name);
    expect(result!.is_active).toEqual(true); // Default value
  });

  it('should return null when updating non-existent card', async () => {
    const updateInput: UpdateBirthdayCardInput = {
      id: 999, // Non-existent ID
      title: 'This should not work'
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).toBeNull();
  });

  it('should handle boolean field updates correctly', async () => {
    // Create test card
    const card = await createTestCard();

    // Update is_active to false
    const updateInput: UpdateBirthdayCardInput = {
      id: card.id,
      is_active: false
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).not.toBeNull();
    expect(result!.is_active).toEqual(false);

    // Update is_active back to true
    const updateInput2: UpdateBirthdayCardInput = {
      id: card.id,
      is_active: true
    };

    const result2 = await updateBirthdayCard(updateInput2);

    expect(result2).not.toBeNull();
    expect(result2!.is_active).toEqual(true);
  });

  it('should preserve original created_at timestamp', async () => {
    // Create test card
    const card = await createTestCard();
    const originalCreatedAt = card.created_at;

    // Wait a small amount to ensure timestamp would be different if updated
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateBirthdayCardInput = {
      id: card.id,
      title: 'Updated Title'
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).not.toBeNull();
    expect(result!.created_at).toEqual(originalCreatedAt);
  });
});
