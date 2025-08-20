import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput } from '../schema';
import { createBirthdayCard } from '../handlers/create_birthday_card';
import { eq } from 'drizzle-orm';

// Test input for birthday card creation
const testInput: CreateBirthdayCardInput = {
  recipient_name: 'John Doe',
  message: 'Happy Birthday! Hope you have a wonderful day!',
  sender_name: 'Jane Smith',
  theme: 'confetti'
};

describe('createBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a birthday card with all required fields', async () => {
    const result = await createBirthdayCard(testInput);

    // Verify all input fields are correctly stored
    expect(result.recipient_name).toEqual('John Doe');
    expect(result.message).toEqual('Happy Birthday! Hope you have a wonderful day!');
    expect(result.sender_name).toEqual('Jane Smith');
    expect(result.theme).toEqual('confetti');
    
    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save birthday card to database', async () => {
    const result = await createBirthdayCard(testInput);

    // Query database to verify card was saved
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards).toHaveLength(1);
    expect(cards[0].recipient_name).toEqual('John Doe');
    expect(cards[0].message).toEqual(testInput.message);
    expect(cards[0].sender_name).toEqual('Jane Smith');
    expect(cards[0].theme).toEqual('confetti');
    expect(cards[0].created_at).toBeInstanceOf(Date);
    expect(cards[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create cards with different themes', async () => {
    const balloonsInput: CreateBirthdayCardInput = {
      recipient_name: 'Alice Cooper',
      message: 'Another year older, another year wiser!',
      sender_name: 'Bob Wilson',
      theme: 'balloons'
    };

    const sparklesInput: CreateBirthdayCardInput = {
      recipient_name: 'Charlie Brown',
      message: 'Wishing you sparkles and joy!',
      sender_name: 'Lucy Van Pelt',
      theme: 'sparkles'
    };

    const confettiCard = await createBirthdayCard(testInput);
    const balloonsCard = await createBirthdayCard(balloonsInput);
    const sparklesCard = await createBirthdayCard(sparklesInput);

    expect(confettiCard.theme).toEqual('confetti');
    expect(balloonsCard.theme).toEqual('balloons');
    expect(sparklesCard.theme).toEqual('sparkles');

    // Verify all cards have unique IDs
    expect(confettiCard.id).not.toEqual(balloonsCard.id);
    expect(balloonsCard.id).not.toEqual(sparklesCard.id);
    expect(confettiCard.id).not.toEqual(sparklesCard.id);
  });

  it('should handle long messages correctly', async () => {
    const longMessageInput: CreateBirthdayCardInput = {
      recipient_name: 'Test User',
      message: 'This is a very long birthday message that contains multiple sentences. It should be stored correctly in the database without any truncation. Happy birthday to you, happy birthday to you, happy birthday dear friend, happy birthday to you! May this year bring you joy, happiness, success, and all the wonderful things life has to offer.',
      sender_name: 'Message Sender',
      theme: 'balloons'
    };

    const result = await createBirthdayCard(longMessageInput);

    expect(result.message).toEqual(longMessageInput.message);
    expect(result.message.length).toBeGreaterThan(100);

    // Verify in database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards[0].message).toEqual(longMessageInput.message);
  });

  it('should handle special characters in names and messages', async () => {
    const specialCharsInput: CreateBirthdayCardInput = {
      recipient_name: 'José María',
      message: 'Happy Birthday! 🎉🎂 Hope you have an amazing day! ❤️',
      sender_name: 'François & Amélie',
      theme: 'sparkles'
    };

    const result = await createBirthdayCard(specialCharsInput);

    expect(result.recipient_name).toEqual('José María');
    expect(result.message).toContain('🎉🎂');
    expect(result.message).toContain('❤️');
    expect(result.sender_name).toEqual('François & Amélie');

    // Verify special characters are preserved in database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards[0].recipient_name).toEqual('José María');
    expect(cards[0].sender_name).toEqual('François & Amélie');
    expect(cards[0].message).toContain('🎉🎂');
  });

  it('should create multiple cards successfully', async () => {
    const input1: CreateBirthdayCardInput = {
      recipient_name: 'Person One',
      message: 'First birthday message',
      sender_name: 'Sender One',
      theme: 'confetti'
    };

    const input2: CreateBirthdayCardInput = {
      recipient_name: 'Person Two',
      message: 'Second birthday message',
      sender_name: 'Sender Two',
      theme: 'balloons'
    };

    const card1 = await createBirthdayCard(input1);
    const card2 = await createBirthdayCard(input2);

    // Verify both cards were created with unique IDs
    expect(card1.id).not.toEqual(card2.id);
    expect(card1.recipient_name).toEqual('Person One');
    expect(card2.recipient_name).toEqual('Person Two');

    // Verify both cards exist in database
    const allCards = await db.select()
      .from(birthdayCardsTable)
      .execute();

    expect(allCards).toHaveLength(2);
    expect(allCards.some(card => card.recipient_name === 'Person One')).toBe(true);
    expect(allCards.some(card => card.recipient_name === 'Person Two')).toBe(true);
  });
});
