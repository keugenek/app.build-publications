import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable } from '../db/schema';
import { type CreateBirthdayCardInput } from '../schema';
import { createBirthdayCard } from '../handlers/create_birthday_card';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateBirthdayCardInput = {
  recipient_name: 'Alice Johnson',
  message: 'Happy Birthday! Hope you have a wonderful day filled with joy and celebration!'
};

describe('createBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a birthday card', async () => {
    const result = await createBirthdayCard(testInput);

    // Basic field validation
    expect(result.recipient_name).toEqual('Alice Johnson');
    expect(result.message).toEqual('Happy Birthday! Hope you have a wonderful day filled with joy and celebration!');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save birthday card to database', async () => {
    const result = await createBirthdayCard(testInput);

    // Query using proper drizzle syntax
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards).toHaveLength(1);
    expect(cards[0].recipient_name).toEqual('Alice Johnson');
    expect(cards[0].message).toEqual(testInput.message);
    expect(cards[0].created_at).toBeInstanceOf(Date);
    expect(cards[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different recipient names and messages', async () => {
    const inputs: CreateBirthdayCardInput[] = [
      {
        recipient_name: 'Bob Smith',
        message: 'Wishing you a fantastic birthday!'
      },
      {
        recipient_name: 'Carol Williams',
        message: 'May your special day be filled with happiness and surrounded by loved ones!'
      },
      {
        recipient_name: 'David Brown',
        message: 'Happy Birthday! 🎂🎉'
      }
    ];

    const results = [];
    for (const input of inputs) {
      const result = await createBirthdayCard(input);
      results.push(result);
    }

    // Verify all cards were created with unique IDs
    expect(results).toHaveLength(3);
    const ids = results.map(r => r.id);
    expect(new Set(ids).size).toBe(3); // All IDs should be unique

    // Verify each card has correct data
    for (let i = 0; i < results.length; i++) {
      expect(results[i].recipient_name).toEqual(inputs[i].recipient_name);
      expect(results[i].message).toEqual(inputs[i].message);
      expect(results[i].created_at).toBeInstanceOf(Date);
      expect(results[i].updated_at).toBeInstanceOf(Date);
    }
  });

  it('should handle special characters in recipient names and messages', async () => {
    const specialInput: CreateBirthdayCardInput = {
      recipient_name: 'José María O\'Connor-Smith',
      message: 'Happy Birthday! 🎂🎉 Hope you enjoy your "special day" & have lots of fun! ♥️'
    };

    const result = await createBirthdayCard(specialInput);

    expect(result.recipient_name).toEqual('José María O\'Connor-Smith');
    expect(result.message).toEqual('Happy Birthday! 🎂🎉 Hope you enjoy your "special day" & have lots of fun! ♥️');

    // Verify it was saved correctly to database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards[0].recipient_name).toEqual('José María O\'Connor-Smith');
    expect(cards[0].message).toEqual('Happy Birthday! 🎂🎉 Hope you enjoy your "special day" & have lots of fun! ♥️');
  });

  it('should handle long messages correctly', async () => {
    const longMessage = 'A'.repeat(1000); // 1000 character message
    const longInput: CreateBirthdayCardInput = {
      recipient_name: 'Test User',
      message: longMessage
    };

    const result = await createBirthdayCard(longInput);

    expect(result.message).toEqual(longMessage);
    expect(result.message.length).toBe(1000);

    // Verify it was saved correctly to database
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, result.id))
      .execute();

    expect(cards[0].message).toEqual(longMessage);
    expect(cards[0].message.length).toBe(1000);
  });

  it('should set created_at and updated_at timestamps correctly', async () => {
    const beforeCreation = new Date();
    
    const result = await createBirthdayCard(testInput);
    
    const afterCreation = new Date();

    // Check that timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000); // Allow 1 second buffer
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
    
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);

    // Initially, created_at and updated_at should be very close (within milliseconds)
    expect(Math.abs(result.created_at.getTime() - result.updated_at.getTime())).toBeLessThan(1000);
  });

  it('should create multiple birthday cards independently', async () => {
    const card1 = await createBirthdayCard({
      recipient_name: 'First Person',
      message: 'First message'
    });

    const card2 = await createBirthdayCard({
      recipient_name: 'Second Person', 
      message: 'Second message'
    });

    // Ensure they have different IDs
    expect(card1.id).not.toEqual(card2.id);

    // Verify both exist in database
    const allCards = await db.select()
      .from(birthdayCardsTable)
      .execute();

    expect(allCards).toHaveLength(2);
    
    const card1InDb = allCards.find(c => c.id === card1.id);
    const card2InDb = allCards.find(c => c.id === card2.id);
    
    expect(card1InDb).toBeDefined();
    expect(card2InDb).toBeDefined();
    expect(card1InDb!.recipient_name).toEqual('First Person');
    expect(card2InDb!.recipient_name).toEqual('Second Person');
  });
});
