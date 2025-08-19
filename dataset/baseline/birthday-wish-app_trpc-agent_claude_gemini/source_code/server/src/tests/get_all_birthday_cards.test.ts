import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput } from '../schema';
import { getAllBirthdayCards } from '../handlers/get_all_birthday_cards';

// Test data for creating birthday cards
const testCards: CreateBirthdayCardInput[] = [
  {
    recipient_name: 'Alice Johnson',
    message: 'Happy Birthday Alice! Hope you have a wonderful day!'
  },
  {
    recipient_name: 'Bob Smith',
    message: 'Wishing you the best birthday ever, Bob!'
  },
  {
    recipient_name: 'Carol Davis',
    message: 'Happy Birthday Carol! May all your dreams come true!'
  }
];

describe('getAllBirthdayCards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no birthday cards exist', async () => {
    const results = await getAllBirthdayCards();
    
    expect(results).toEqual([]);
    expect(results).toHaveLength(0);
  });

  it('should return all birthday cards', async () => {
    // Create test birthday cards
    await db.insert(birthdayCardsTable)
      .values(testCards)
      .execute();

    const results = await getAllBirthdayCards();

    expect(results).toHaveLength(3);
    
    // Check that all cards are returned with proper fields
    results.forEach(card => {
      expect(card.id).toBeDefined();
      expect(card.recipient_name).toBeDefined();
      expect(card.message).toBeDefined();
      expect(card.created_at).toBeInstanceOf(Date);
      expect(card.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific card data is included
    const names = results.map(card => card.recipient_name);
    expect(names).toContain('Alice Johnson');
    expect(names).toContain('Bob Smith');
    expect(names).toContain('Carol Davis');
  });

  it('should return cards ordered by creation date (newest first)', async () => {
    // Create cards one by one with slight delays to ensure different timestamps
    const card1 = await db.insert(birthdayCardsTable)
      .values(testCards[0])
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const card2 = await db.insert(birthdayCardsTable)
      .values(testCards[1])
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const card3 = await db.insert(birthdayCardsTable)
      .values(testCards[2])
      .returning()
      .execute();

    const results = await getAllBirthdayCards();

    expect(results).toHaveLength(3);
    
    // Should be ordered newest first (descending by created_at)
    expect(results[0].created_at >= results[1].created_at).toBe(true);
    expect(results[1].created_at >= results[2].created_at).toBe(true);

    // First result should be the last created card (Carol Davis)
    expect(results[0].recipient_name).toEqual('Carol Davis');
    // Last result should be the first created card (Alice Johnson)
    expect(results[2].recipient_name).toEqual('Alice Johnson');
  });

  it('should handle single birthday card correctly', async () => {
    await db.insert(birthdayCardsTable)
      .values(testCards[0])
      .execute();

    const results = await getAllBirthdayCards();

    expect(results).toHaveLength(1);
    expect(results[0].recipient_name).toEqual('Alice Johnson');
    expect(results[0].message).toEqual('Happy Birthday Alice! Hope you have a wonderful day!');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return cards with all required fields populated', async () => {
    await db.insert(birthdayCardsTable)
      .values(testCards[0])
      .execute();

    const results = await getAllBirthdayCards();
    const card = results[0];

    // Verify all schema fields are present and properly typed
    expect(typeof card.id).toBe('number');
    expect(typeof card.recipient_name).toBe('string');
    expect(typeof card.message).toBe('string');
    expect(card.created_at).toBeInstanceOf(Date);
    expect(card.updated_at).toBeInstanceOf(Date);

    // Verify no unexpected fields are included
    const expectedKeys = ['id', 'recipient_name', 'message', 'created_at', 'updated_at'];
    const actualKeys = Object.keys(card);
    expect(actualKeys.sort()).toEqual(expectedKeys.sort());
  });

  it('should handle cards with various message lengths', async () => {
    const cardsWithVariousMessages = [
      {
        recipient_name: 'Short Message',
        message: 'Hi!'
      },
      {
        recipient_name: 'Long Message',
        message: 'This is a very long birthday message that contains multiple sentences and should be handled properly by the system. It includes wishes for happiness, success, and joy throughout the coming year. May this special day bring wonderful memories and countless blessings!'
      }
    ];

    await db.insert(birthdayCardsTable)
      .values(cardsWithVariousMessages)
      .execute();

    const results = await getAllBirthdayCards();

    expect(results).toHaveLength(2);
    
    // Verify both short and long messages are returned correctly
    const messages = results.map(card => card.message);
    expect(messages).toContain('Hi!');
    expect(messages.some(msg => msg.includes('very long birthday message'))).toBe(true);
  });
});
