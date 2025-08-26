import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { db } from '../db';
import { kanjis } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { updateKanji } from '../handlers/update_kanji';
import type { UpdateKanjiInput } from '../schema';

describe('updateKanji handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates existing kanji fields correctly', async () => {
    // Insert a kanji directly into the database
    const insertResult = await db
      .insert(kanjis)
      .values({
        character: '\u65e5', // 日
        meaning: 'day',
        reading: '\u30cb\u30c1', // ニチ
        jlpt_level: 5
      })
      .returning()
      .execute();

    const original = insertResult[0];

    const updateInput: UpdateKanjiInput = {
      id: original.id,
      character: '\u6708', // 月
      jlpt_level: 4 // Change JLPT level
      // meaning and reading omitted (should remain unchanged)
    };

    const updated = await updateKanji(updateInput);

    // Verify the returned object reflects updates
    expect(updated.id).toBe(original.id);
    expect(updated.character).toBe('\u6708');
    expect(updated.jlpt_level).toBe(4);
    expect(updated.meaning).toBe(original.meaning);
    expect(updated.reading).toBe(original.reading);
    expect(updated.created_at).toBeInstanceOf(Date);

    // Verify the database record is updated accordingly
    const dbRecordArray = await db
      .select()
      .from(kanjis)
      .where(eq(kanjis.id, original.id))
      .execute();
    const dbRecord = dbRecordArray[0];
    expect(dbRecord.character).toBe('\u6708');
    expect(dbRecord.jlpt_level).toBe(4);
    expect(dbRecord.meaning).toBe(original.meaning);
    expect(dbRecord.reading).toBe(original.reading);
  });

  it('throws an error when the kanji does not exist', async () => {
    const nonExistentId = 9999;
    const updateInput: UpdateKanjiInput = {
      id: nonExistentId,
      character: '\u706b' // 火
    };

    await expect(updateKanji(updateInput)).rejects.toThrow();
  });
});
