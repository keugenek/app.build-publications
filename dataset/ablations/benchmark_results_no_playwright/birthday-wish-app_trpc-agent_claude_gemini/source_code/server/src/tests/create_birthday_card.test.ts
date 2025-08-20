import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput, createBirthdayCardInputSchema } from '../schema';
import { createBirthdayCard } from '../handlers/create_birthday_card';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateBirthdayCardInput = {
  title: 'Happy Birthday!',
  message: 'Wishing you a wonderful birthday filled with joy and happiness!',
  recipient_name: 'Alice Johnson',
  sender_name: 'Bob Smith',
  theme_color: '#ff69b4', // Include even though it has a default
  is_active: true // Include even though it has a default
};

describe('createBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a birthday card with all fields', async () => {
    const result = await createBirthdayCard(testInput);

    // Basic field validation
    expect(result.title).toEqual('Happy Birthday!');
    expect(result.message).toEqual('Wishing you a wonderful birthday filled with joy and happiness!');
    expect(result.recipient_name).toEqual('Alice Johnson');
    expect(result.sender_name).toEqual('Bob Smith');
    expect(result.theme_color).toEqual('#ff69b4');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save birthday card to database', async () => {
    const result = await createBirthdayCard(testInput);

    // Query using proper drizzle syntax
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards).toHaveLength(1);
    expect(cards[0].title).toEqual('Happy Birthday!');
    expect(cards[0].message).toEqual(testInput.message);
    expect(cards[0].recipient_name).toEqual('Alice Johnson');
    expect(cards[0].sender_name).toEqual('Bob Smith');
    expect(cards[0].theme_color).toEqual('#ff69b4');
    expect(cards[0].is_active).toEqual(true);
    expect(cards[0].created_at).toBeInstanceOf(Date);
  });

  it('should apply default theme color when not provided', async () => {
    // Parse input with Zod to apply defaults
    const inputWithoutTheme = createBirthdayCardInputSchema.parse({
      title: 'Birthday Wishes',
      message: 'Have a great day!',
      recipient_name: 'Jane Doe',
      sender_name: 'John Doe'
      // theme_color and is_active will use defaults
    });

    const result = await createBirthdayCard(inputWithoutTheme);

    expect(result.theme_color).toEqual('#ff69b4'); // Default pink theme
    expect(result.is_active).toEqual(true); // Default active state
  });

  it('should apply default is_active when not provided', async () => {
    // Parse input with Zod to apply defaults
    const inputWithoutActive = createBirthdayCardInputSchema.parse({
      title: 'Special Day',
      message: 'Celebrating you today!',
      recipient_name: 'Sam Wilson',
      sender_name: 'Emma Wilson',
      theme_color: '#00ced1' // Custom color but no is_active
    });

    const result = await createBirthdayCard(inputWithoutActive);

    expect(result.is_active).toEqual(true); // Default active state
    expect(result.theme_color).toEqual('#00ced1'); // Custom color preserved
  });

  it('should handle custom theme colors correctly', async () => {
    const customThemeInput = {
      ...testInput,
      theme_color: '#00ff00' // Green theme
    };

    const result = await createBirthdayCard(customThemeInput);

    expect(result.theme_color).toEqual('#00ff00');
    
    // Verify in database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards[0].theme_color).toEqual('#00ff00');
  });

  it('should handle inactive cards correctly', async () => {
    const inactiveCardInput = {
      ...testInput,
      is_active: false
    };

    const result = await createBirthdayCard(inactiveCardInput);

    expect(result.is_active).toEqual(false);
    
    // Verify in database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards[0].is_active).toEqual(false);
  });

  it('should create multiple cards with unique IDs', async () => {
    // Parse inputs with Zod to apply defaults
    const input1 = createBirthdayCardInputSchema.parse({
      title: 'Birthday Card 1',
      message: 'Message 1',
      recipient_name: 'Person 1',
      sender_name: 'Sender 1'
    });

    const input2 = createBirthdayCardInputSchema.parse({
      title: 'Birthday Card 2', 
      message: 'Message 2',
      recipient_name: 'Person 2',
      sender_name: 'Sender 2'
    });

    const result1 = await createBirthdayCard(input1);
    const result2 = await createBirthdayCard(input2);

    // Should have different IDs
    expect(result1.id).not.toEqual(result2.id);
    
    // Both should be in database
    const allCards = await db.select()
      .from(birthdayCardsTable)
      .execute();

    expect(allCards).toHaveLength(2);
    expect(allCards.map(card => card.title)).toContain('Birthday Card 1');
    expect(allCards.map(card => card.title)).toContain('Birthday Card 2');
  });
});
