import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cardsTable } from '../db/schema';
import { updateCard } from '../handlers/update_card';
import { eq } from 'drizzle-orm';

// Helper to create a card directly in DB for test setup
const createTestCard = async (message: string, photos: string[]) => {
  const result = await db
    .insert(cardsTable)
    .values({
      message,
      photos: JSON.stringify(photos),
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateCard handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates both message and photos', async () => {
    const original = await createTestCard('Happy Birthday', ['url1']);

    const updated = await updateCard({
      id: original.id,
      message: 'Congratulations',
      photos: ['url2', 'url3'],
    });

    expect(updated.id).toBe(original.id);
    expect(updated.message).toBe('Congratulations');
    expect(updated.photos).toEqual(['url2', 'url3']);
    expect(updated.created_at).toBeInstanceOf(Date);

    // Verify persisted changes
    const persisted = await db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.id, original.id))
      .execute();
    expect(persisted).toHaveLength(1);
    const row = persisted[0];
    expect(row.message).toBe('Congratulations');
    expect(JSON.parse(row.photos)).toEqual(['url2', 'url3']);
  });

  it('updates only provided fields (partial update)', async () => {
    const original = await createTestCard('Hello', ['first']);

    const updated = await updateCard({
      id: original.id,
      message: 'Hello Updated',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.message).toBe('Hello Updated');
    // Photos should remain unchanged
    expect(updated.photos).toEqual(['first']);
  });

  it('throws an error when the card does not exist', async () => {
    await expect(
      updateCard({ id: 9999, message: 'Missing' })
    ).rejects.toThrow(/not found/i);
  });
});
