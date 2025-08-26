import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type UpdateBirthdayCardInput, type CreateBirthdayCardInput } from '../schema';
import { updateBirthdayCard } from '../handlers/update_birthday_card';
import { eq } from 'drizzle-orm';

// Helper function to create a test birthday card
const createTestCard = async (input: CreateBirthdayCardInput) => {
  const result = await db.insert(birthdayCardsTable)
    .values({
      recipient_name: input.recipient_name,
      message: input.message,
      sender_name: input.sender_name,
      theme: input.theme
    })
    .returning()
    .execute();

  return result[0];
};

// Test input data
const testCardInput: CreateBirthdayCardInput = {
  recipient_name: 'Alice Johnson',
  message: 'Happy Birthday! Hope your day is wonderful!',
  sender_name: 'Bob Smith',
  theme: 'confetti'
};

describe('updateBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a single field (recipient_name)', async () => {
    // Create a test card first
    const createdCard = await createTestCard(testCardInput);

    const updateInput: UpdateBirthdayCardInput = {
      id: createdCard.id,
      recipient_name: 'Alice Williams'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCard.id);
    expect(result!.recipient_name).toEqual('Alice Williams');
    expect(result!.message).toEqual(testCardInput.message);
    expect(result!.sender_name).toEqual(testCardInput.sender_name);
    expect(result!.theme).toEqual(testCardInput.theme);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdCard.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a test card first
    const createdCard = await createTestCard(testCardInput);

    const updateInput: UpdateBirthdayCardInput = {
      id: createdCard.id,
      recipient_name: 'Charlie Brown',
      message: 'Wishing you a fantastic birthday celebration!',
      theme: 'balloons'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify all updated fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCard.id);
    expect(result!.recipient_name).toEqual('Charlie Brown');
    expect(result!.message).toEqual('Wishing you a fantastic birthday celebration!');
    expect(result!.sender_name).toEqual(testCardInput.sender_name); // Should remain unchanged
    expect(result!.theme).toEqual('balloons');
    expect(result!.updated_at > createdCard.updated_at).toBe(true);
  });

  it('should update all fields', async () => {
    // Create a test card first
    const createdCard = await createTestCard(testCardInput);

    const updateInput: UpdateBirthdayCardInput = {
      id: createdCard.id,
      recipient_name: 'Diana Prince',
      message: 'May your special day be filled with happiness and joy!',
      sender_name: 'Clark Kent',
      theme: 'sparkles'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify all fields were updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCard.id);
    expect(result!.recipient_name).toEqual('Diana Prince');
    expect(result!.message).toEqual('May your special day be filled with happiness and joy!');
    expect(result!.sender_name).toEqual('Clark Kent');
    expect(result!.theme).toEqual('sparkles');
    expect(result!.updated_at > createdCard.updated_at).toBe(true);
  });

  it('should save changes to database correctly', async () => {
    // Create a test card first
    const createdCard = await createTestCard(testCardInput);

    const updateInput: UpdateBirthdayCardInput = {
      id: createdCard.id,
      recipient_name: 'Eva Green',
      message: 'Hope your birthday is as amazing as you are!'
    };

    await updateBirthdayCard(updateInput);

    // Query the database directly to verify persistence
    const savedCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, createdCard.id))
      .execute();

    expect(savedCards).toHaveLength(1);
    const savedCard = savedCards[0];
    expect(savedCard.recipient_name).toEqual('Eva Green');
    expect(savedCard.message).toEqual('Hope your birthday is as amazing as you are!');
    expect(savedCard.sender_name).toEqual(testCardInput.sender_name); // Unchanged
    expect(savedCard.theme).toEqual(testCardInput.theme); // Unchanged
    expect(savedCard.updated_at).toBeInstanceOf(Date);
    expect(savedCard.updated_at > createdCard.updated_at).toBe(true);
  });

  it('should return null when birthday card does not exist', async () => {
    const nonExistentId = 999;

    const updateInput: UpdateBirthdayCardInput = {
      id: nonExistentId,
      recipient_name: 'John Doe'
    };

    const result = await updateBirthdayCard(updateInput);

    expect(result).toBeNull();
  });

  it('should handle theme updates correctly', async () => {
    // Create a test card with 'confetti' theme
    const createdCard = await createTestCard({
      ...testCardInput,
      theme: 'confetti'
    });

    // Test updating to 'balloons'
    const updateToBalloons: UpdateBirthdayCardInput = {
      id: createdCard.id,
      theme: 'balloons'
    };

    const balloonsResult = await updateBirthdayCard(updateToBalloons);
    expect(balloonsResult!.theme).toEqual('balloons');

    // Test updating to 'sparkles'
    const updateToSparkles: UpdateBirthdayCardInput = {
      id: createdCard.id,
      theme: 'sparkles'
    };

    const sparklesResult = await updateBirthdayCard(updateToSparkles);
    expect(sparklesResult!.theme).toEqual('sparkles');
  });

  it('should preserve created_at timestamp when updating', async () => {
    // Create a test card first
    const createdCard = await createTestCard(testCardInput);
    const originalCreatedAt = createdCard.created_at;

    // Add a small delay to ensure updated_at will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateBirthdayCardInput = {
      id: createdCard.id,
      recipient_name: 'Frank Miller'
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify created_at is preserved but updated_at is changed
    expect(result!.created_at).toEqual(originalCreatedAt);
    expect(result!.updated_at > originalCreatedAt).toBe(true);
  });

  it('should update timestamp even with no other field changes', async () => {
    // Create a test card first
    const createdCard = await createTestCard(testCardInput);
    const originalUpdatedAt = createdCard.updated_at;

    // Add a small delay to ensure updated_at will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with no field changes (only id provided)
    const updateInput: UpdateBirthdayCardInput = {
      id: createdCard.id
    };

    const result = await updateBirthdayCard(updateInput);

    // Verify only updated_at changed
    expect(result!.id).toEqual(createdCard.id);
    expect(result!.recipient_name).toEqual(createdCard.recipient_name);
    expect(result!.message).toEqual(createdCard.message);
    expect(result!.sender_name).toEqual(createdCard.sender_name);
    expect(result!.theme).toEqual(createdCard.theme);
    expect(result!.created_at).toEqual(createdCard.created_at);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
  });
});
