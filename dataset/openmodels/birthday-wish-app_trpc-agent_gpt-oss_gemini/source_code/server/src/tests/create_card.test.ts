import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cardsTable } from '../db/schema';
import { type CreateCardInput } from '../schema';
import { createCard } from '../handlers/create_card';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCardInput = {
  message: 'Happy Birthday! 🎉',
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
};

describe('createCard handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a card and return correct data', async () => {
    const result = await createCard(testInput);

    // Validate returned fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.message).toBe(testInput.message);
    expect(result.photos).toEqual(testInput.photos);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the card in the database with proper JSON storage', async () => {
    const result = await createCard(testInput);

    const rows = await db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.message).toBe(testInput.message);
    // photos column is stored as JSON string
    expect(typeof row.photos).toBe('string');
    expect(JSON.parse(row.photos)).toEqual(testInput.photos);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
