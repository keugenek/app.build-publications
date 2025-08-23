import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { cards } from '../db/schema';
import { type CreateCardInput, type Card } from '../schema';
import { createCard, getCards } from '../handlers/create_card';
import { eq } from 'drizzle-orm';

// Test input for creating a card
const testInput: CreateCardInput = {
  name: 'Alice',
  message: 'Happy Birthday, Alice!',
  animation_type: 'confetti',
};

describe('createCard handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a card and return the created record', async () => {
    const result: Card = await createCard(testInput);

    // Verify returned fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.message).toBe(testInput.message);
    expect(result.animation_type).toBe(testInput.animation_type);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the card in the database', async () => {
    const created = await createCard(testInput);

    const rows = await db.select().from(cards).where(eq(cards.id, created.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.message).toBe(testInput.message);
    expect(row.animation_type).toBe(testInput.animation_type);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('getCards should return all stored cards', async () => {
    // Insert two cards
    const card1 = await createCard({ name: 'Bob', message: 'Happy Birthday, Bob!', animation_type: 'balloons' });
    const card2 = await createCard({ name: 'Carol', message: 'Happy Birthday, Carol!', animation_type: 'fireworks' });

    const allCards = await getCards();
    // Should contain at least the two we just added
    const ids = allCards.map((c) => c.id);
    expect(ids).toContain(card1.id);
    expect(ids).toContain(card2.id);
  });
});
