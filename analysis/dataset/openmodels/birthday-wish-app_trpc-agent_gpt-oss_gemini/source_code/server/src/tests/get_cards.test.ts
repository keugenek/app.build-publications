import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cardsTable } from '../db/schema';
import { type Card } from '../schema';
import { getCards } from '../handlers/get_cards';
import { eq } from 'drizzle-orm';

describe('getCards handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all cards with parsed photos', async () => {
    // Insert a card directly via DB
    const insertResult = await db
      .insert(cardsTable)
      .values({
        message: 'Happy Birthday',
        photos: JSON.stringify(['https://example.com/photo1.png', 'https://example.com/photo2.png']),
      })
      .returning()
      .execute();

    const inserted = insertResult[0];
    // Verify DB insertion works
    const dbRows = await db.select().from(cardsTable).where(eq(cardsTable.id, inserted.id)).execute();
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].photos).toBe(JSON.stringify(['https://example.com/photo1.png', 'https://example.com/photo2.png']));

    // Use the handler
    const cards: Card[] = await getCards();
    expect(cards).toHaveLength(1);
    const card = cards[0];
    expect(card.id).toBe(inserted.id);
    expect(card.message).toBe('Happy Birthday');
    expect(Array.isArray(card.photos)).toBe(true);
    expect(card.photos).toEqual(['https://example.com/photo1.png', 'https://example.com/photo2.png']);
    expect(card.created_at).toBeInstanceOf(Date);
  });

  it('should handle cards with empty photos array', async () => {
    await db
      .insert(cardsTable)
      .values({
        message: 'No photos',
        photos: JSON.stringify([]),
      })
      .execute();

    const cards = await getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].photos).toEqual([]);
  });
});
