import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjisTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateKanjiInput = {
  character: '日',
  meaning: 'sun',
  onyomi: 'ニチ',
  kunyomi: 'ひ',
  jlpt_level: 3
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji entry and return all fields', async () => {
    const result = await createKanji(testInput);

    expect(result.id).toBeDefined();
    expect(result.character).toBe(testInput.character);
    expect(result.meaning).toBe(testInput.meaning);
    expect(result.onyomi).toBe(testInput.onyomi);
    expect(result.kunyomi).toBe(testInput.kunyomi);
    expect(result.jlpt_level).toBe(testInput.jlpt_level);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the kanji in the database', async () => {
    const result = await createKanji(testInput);

    const rows = await db
      .select()
      .from(kanjisTable)
      .where(eq(kanjisTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.character).toBe(testInput.character);
    expect(row.meaning).toBe(testInput.meaning);
    expect(row.onyomi).toBe(testInput.onyomi);
    expect(row.kunyomi).toBe(testInput.kunyomi);
    expect(row.jlpt_level).toBe(testInput.jlpt_level);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
