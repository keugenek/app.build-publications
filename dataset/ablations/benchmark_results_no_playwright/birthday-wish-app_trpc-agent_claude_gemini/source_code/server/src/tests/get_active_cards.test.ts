import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput } from '../schema';
import { getActiveCards } from '../handlers/get_active_cards';

// Test data for birthday cards
const activeCardInput: CreateBirthdayCardInput = {
  title: 'Happy Birthday Sarah!',
  message: 'Hope you have a wonderful day filled with joy and celebration!',
  recipient_name: 'Sarah Johnson',
  sender_name: 'John Smith',
  theme_color: '#ff1493', // Deep pink
  is_active: true
};

const inactiveCardInput: CreateBirthdayCardInput = {
  title: 'Birthday Wishes',
  message: 'Many happy returns of the day!',
  recipient_name: 'Mike Davis',
  sender_name: 'Lisa Brown',
  theme_color: '#32cd32', // Lime green
  is_active: false
};

const defaultCardInput: CreateBirthdayCardInput = {
  title: 'Another Year Older',
  message: 'Celebrating another amazing year of your life!',
  recipient_name: 'Emma Wilson',
  sender_name: 'David Lee',
  theme_color: '#ff69b4', // Default pink theme
  is_active: true // Default value
};

describe('getActiveCards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only active birthday cards', async () => {
    // Create test cards - one active, one inactive
    await db.insert(birthdayCardsTable)
      .values([
        {
          title: activeCardInput.title,
          message: activeCardInput.message,
          recipient_name: activeCardInput.recipient_name,
          sender_name: activeCardInput.sender_name,
          theme_color: activeCardInput.theme_color,
          is_active: activeCardInput.is_active
        },
        {
          title: inactiveCardInput.title,
          message: inactiveCardInput.message,
          recipient_name: inactiveCardInput.recipient_name,
          sender_name: inactiveCardInput.sender_name,
          theme_color: inactiveCardInput.theme_color,
          is_active: inactiveCardInput.is_active
        }
      ])
      .execute();

    const result = await getActiveCards();

    // Should only return the active card
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Happy Birthday Sarah!');
    expect(result[0].recipient_name).toEqual('Sarah Johnson');
    expect(result[0].sender_name).toEqual('John Smith');
    expect(result[0].theme_color).toEqual('#ff1493');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no active cards exist', async () => {
    // Create only inactive cards
    await db.insert(birthdayCardsTable)
      .values({
        title: inactiveCardInput.title,
        message: inactiveCardInput.message,
        recipient_name: inactiveCardInput.recipient_name,
        sender_name: inactiveCardInput.sender_name,
        theme_color: inactiveCardInput.theme_color,
        is_active: false
      })
      .execute();

    const result = await getActiveCards();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return multiple active cards when they exist', async () => {
    // Create multiple active cards
    await db.insert(birthdayCardsTable)
      .values([
        {
          title: activeCardInput.title,
          message: activeCardInput.message,
          recipient_name: activeCardInput.recipient_name,
          sender_name: activeCardInput.sender_name,
          theme_color: activeCardInput.theme_color,
          is_active: true
        },
        {
          title: defaultCardInput.title,
          message: defaultCardInput.message,
          recipient_name: defaultCardInput.recipient_name,
          sender_name: defaultCardInput.sender_name,
          theme_color: defaultCardInput.theme_color,
          is_active: true
        },
        {
          title: inactiveCardInput.title,
          message: inactiveCardInput.message,
          recipient_name: inactiveCardInput.recipient_name,
          sender_name: inactiveCardInput.sender_name,
          theme_color: inactiveCardInput.theme_color,
          is_active: false // This one should be filtered out
        }
      ])
      .execute();

    const result = await getActiveCards();

    // Should return only the 2 active cards
    expect(result).toHaveLength(2);
    
    // All returned cards should be active
    result.forEach(card => {
      expect(card.is_active).toBe(true);
      expect(card.id).toBeDefined();
      expect(card.created_at).toBeInstanceOf(Date);
    });

    // Check specific cards are included
    const titles = result.map(card => card.title);
    expect(titles).toContain('Happy Birthday Sarah!');
    expect(titles).toContain('Another Year Older');
    expect(titles).not.toContain('Birthday Wishes'); // Inactive card should not be included
  });

  it('should return cards with default theme color applied', async () => {
    // Create card using database defaults
    await db.insert(birthdayCardsTable)
      .values({
        title: 'Test Card',
        message: 'Test message',
        recipient_name: 'Test Recipient',
        sender_name: 'Test Sender'
        // theme_color and is_active will use database defaults
      })
      .execute();

    const result = await getActiveCards();

    expect(result).toHaveLength(1);
    expect(result[0].theme_color).toEqual('#ff69b4'); // Default pink theme
    expect(result[0].is_active).toBe(true); // Default active status
  });

  it('should handle empty database correctly', async () => {
    // No cards created - database is empty
    const result = await getActiveCards();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should preserve all card properties in response', async () => {
    // Create a card with all fields populated
    await db.insert(birthdayCardsTable)
      .values({
        title: activeCardInput.title,
        message: activeCardInput.message,
        recipient_name: activeCardInput.recipient_name,
        sender_name: activeCardInput.sender_name,
        theme_color: activeCardInput.theme_color,
        is_active: activeCardInput.is_active
      })
      .execute();

    const result = await getActiveCards();

    expect(result).toHaveLength(1);
    const card = result[0];

    // Verify all expected properties are present
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('title');
    expect(card).toHaveProperty('message');
    expect(card).toHaveProperty('recipient_name');
    expect(card).toHaveProperty('sender_name');
    expect(card).toHaveProperty('theme_color');
    expect(card).toHaveProperty('is_active');
    expect(card).toHaveProperty('created_at');

    // Verify property types
    expect(typeof card.id).toBe('number');
    expect(typeof card.title).toBe('string');
    expect(typeof card.message).toBe('string');
    expect(typeof card.recipient_name).toBe('string');
    expect(typeof card.sender_name).toBe('string');
    expect(typeof card.theme_color).toBe('string');
    expect(typeof card.is_active).toBe('boolean');
    expect(card.created_at).toBeInstanceOf(Date);
  });
});
