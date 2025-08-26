import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateKanjiInput = {
  kanji: '一',
  meaning: 'one',
  onyomi: 'いち',
  kunyomi: 'ひと',
  jlpt_level: 'N5'
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji', async () => {
    const result = await createKanji(testInput);

    // Basic field validation
    expect(result.kanji).toEqual('一');
    expect(result.meaning).toEqual(testInput.meaning);
    expect(result.onyomi).toEqual(testInput.onyomi);
    expect(result.kunyomi).toEqual(testInput.kunyomi);
    expect(result.jlpt_level).toEqual('N5');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testInput);

    // Query using proper drizzle syntax
    const kanjiRecords = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(kanjiRecords).toHaveLength(1);
    expect(kanjiRecords[0].kanji).toEqual('一');
    expect(kanjiRecords[0].meaning).toEqual(testInput.meaning);
    expect(kanjiRecords[0].onyomi).toEqual(testInput.onyomi);
    expect(kanjiRecords[0].kunyomi).toEqual(testInput.kunyomi);
    expect(kanjiRecords[0].jlpt_level).toEqual('N5');
    expect(kanjiRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle kanji with null readings', async () => {
    const inputWithNullReadings: CreateKanjiInput = {
      kanji: '々',
      meaning: 'repetition of kanji',
      onyomi: null,
      kunyomi: null,
      jlpt_level: 'N3'
    };

    const result = await createKanji(inputWithNullReadings);

    expect(result.kanji).toEqual('々');
    expect(result.meaning).toEqual(inputWithNullReadings.meaning);
    expect(result.onyomi).toBeNull();
    expect(result.kunyomi).toBeNull();
    expect(result.jlpt_level).toEqual('N3');
  });
});
