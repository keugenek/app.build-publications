import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput } from '../schema';
import { createBirthdayCard } from '../handlers/create_birthday_card';
import { eq } from 'drizzle-orm';

// Test input for birthday card creation
const testInput: CreateBirthdayCardInput = {
  title: 'Happy Birthday!',
  message: 'Hope you have a wonderful day filled with joy and celebration!',
  recipient_name: 'Alice Johnson',
  sender_name: 'Bob Smith'
};

describe('createBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a birthday card with all required fields', async () => {
    const result = await createBirthdayCard(testInput);

    // Verify all input fields are preserved
    expect(result.title).toEqual('Happy Birthday!');
    expect(result.message).toEqual(testInput.message);
    expect(result.recipient_name).toEqual('Alice Johnson');
    expect(result.sender_name).toEqual('Bob Smith');
    
    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.is_active).toBe(true); // Default value
  });

  it('should save birthday card to database correctly', async () => {
    const result = await createBirthdayCard(testInput);

    // Query the database to verify the card was saved
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards).toHaveLength(1);
    
    const savedCard = cards[0];
    expect(savedCard.title).toEqual('Happy Birthday!');
    expect(savedCard.message).toEqual(testInput.message);
    expect(savedCard.recipient_name).toEqual('Alice Johnson');
    expect(savedCard.sender_name).toEqual('Bob Smith');
    expect(savedCard.created_at).toBeInstanceOf(Date);
    expect(savedCard.is_active).toBe(true);
  });

  it('should handle different message lengths', async () => {
    const shortMessageInput: CreateBirthdayCardInput = {
      title: 'Short',
      message: 'Hi!',
      recipient_name: 'John',
      sender_name: 'Jane'
    };

    const result = await createBirthdayCard(shortMessageInput);

    expect(result.title).toEqual('Short');
    expect(result.message).toEqual('Hi!');
    expect(result.recipient_name).toEqual('John');
    expect(result.sender_name).toEqual('Jane');
  });

  it('should handle long text content', async () => {
    const longMessageInput: CreateBirthdayCardInput = {
      title: 'A Very Long Birthday Title That Contains Many Words And Celebrates This Special Day',
      message: 'This is a very long birthday message that goes on and on about how wonderful this person is and how much they mean to everyone around them. It includes many heartfelt wishes and lots of love from all their friends and family members who care about them deeply.',
      recipient_name: 'Alexandra Catherine Johnson-Williams',
      sender_name: 'Robert Christopher Smith-Thompson'
    };

    const result = await createBirthdayCard(longMessageInput);

    expect(result.title).toEqual(longMessageInput.title);
    expect(result.message).toEqual(longMessageInput.message);
    expect(result.recipient_name).toEqual(longMessageInput.recipient_name);
    expect(result.sender_name).toEqual(longMessageInput.sender_name);
  });

  it('should handle special characters in content', async () => {
    const specialCharsInput: CreateBirthdayCardInput = {
      title: 'Happy Birthday! 🎂🎉',
      message: 'Hope your day is filled with happiness & love! ❤️ Here\'s to another year of adventures & memories. "The best is yet to come!"',
      recipient_name: 'María José González',
      sender_name: 'François O\'Connor'
    };

    const result = await createBirthdayCard(specialCharsInput);

    expect(result.title).toEqual('Happy Birthday! 🎂🎉');
    expect(result.message).toEqual(specialCharsInput.message);
    expect(result.recipient_name).toEqual('María José González');
    expect(result.sender_name).toEqual('François O\'Connor');
  });

  it('should create multiple birthday cards independently', async () => {
    const input1: CreateBirthdayCardInput = {
      title: 'Birthday Card 1',
      message: 'Message for card 1',
      recipient_name: 'Person 1',
      sender_name: 'Sender 1'
    };

    const input2: CreateBirthdayCardInput = {
      title: 'Birthday Card 2',
      message: 'Message for card 2',
      recipient_name: 'Person 2',
      sender_name: 'Sender 2'
    };

    const result1 = await createBirthdayCard(input1);
    const result2 = await createBirthdayCard(input2);

    // Verify both cards are created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Birthday Card 1');
    expect(result2.title).toEqual('Birthday Card 2');

    // Verify both cards exist in database
    const allCards = await db.select()
      .from(birthdayCardsTable)
      .execute();

    expect(allCards).toHaveLength(2);
    
    const cardIds = allCards.map(card => card.id);
    expect(cardIds).toContain(result1.id);
    expect(cardIds).toContain(result2.id);
  });

  it('should set correct default values for auto-generated fields', async () => {
    const result = await createBirthdayCard(testInput);

    // Verify defaults are applied
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify created_at is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - result.created_at.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });

  it('should preserve exact input values without modification', async () => {
    const exactInput: CreateBirthdayCardInput = {
      title: '   Spaced Title   ',
      message: 'Message\nwith\nnewlines',
      recipient_name: 'UPPERCASE NAME',
      sender_name: 'lowercase name'
    };

    const result = await createBirthdayCard(exactInput);

    // Verify no trimming or case changes occur
    expect(result.title).toEqual('   Spaced Title   ');
    expect(result.message).toEqual('Message\nwith\nnewlines');
    expect(result.recipient_name).toEqual('UPPERCASE NAME');
    expect(result.sender_name).toEqual('lowercase name');
  });
});
