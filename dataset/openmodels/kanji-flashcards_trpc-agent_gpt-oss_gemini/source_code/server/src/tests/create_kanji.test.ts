import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { kanjis } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

const testInput: CreateKanjiInput = {
  character: '日',
  meaning: 'sun/day',
  reading: 'にち',
  jlpt_level: 5
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a kanji and return the created record', async () => {
    const result = await createKanji(testInput);

    // Validate returned fields
    expect(result.id).toBeDefined();
    expect(result.character).toBe(testInput.character);
    expect(result.meaning).toBe(testInput.meaning);
    expect(result.reading).toBe(testInput.reading);
    expect(result.jlpt_level).toBe(testInput.jlpt_level);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the kanji in the database', async () => {
    const created = await createKanji(testInput);

    const rows = await db.select().from(kanjis).where(eq(kanjis.id, created.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.character).toBe(testInput.character);
    expect(row.meaning).toBe(testInput.meaning);
    expect(row.reading).toBe(testInput.reading);
    expect(row.jlpt_level).toBe(testInput.jlpt_level);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
