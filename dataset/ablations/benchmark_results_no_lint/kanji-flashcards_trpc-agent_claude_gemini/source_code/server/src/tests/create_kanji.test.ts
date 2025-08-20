import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateKanjiInput = {
  character: '水',
  meaning: 'water',
  kun_reading: 'みず',
  on_reading: 'スイ',
  romaji: 'mizu',
  jlpt_level: 'N5'
};

// Test input with minimal fields (nullable fields as null)
const minimalInput: CreateKanjiInput = {
  character: '火',
  meaning: 'fire',
  kun_reading: null,
  on_reading: null,
  romaji: null,
  jlpt_level: 'N4'
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji with all fields', async () => {
    const result = await createKanji(testInput);

    // Verify returned data
    expect(result.character).toEqual('水');
    expect(result.meaning).toEqual('water');
    expect(result.kun_reading).toEqual('みず');
    expect(result.on_reading).toEqual('スイ');
    expect(result.romaji).toEqual('mizu');
    expect(result.jlpt_level).toEqual('N5');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a kanji with minimal fields', async () => {
    const result = await createKanji(minimalInput);

    // Verify returned data
    expect(result.character).toEqual('火');
    expect(result.meaning).toEqual('fire');
    expect(result.kun_reading).toBeNull();
    expect(result.on_reading).toBeNull();
    expect(result.romaji).toBeNull();
    expect(result.jlpt_level).toEqual('N4');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testInput);

    // Query database to verify persistence
    const savedKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(savedKanji).toHaveLength(1);
    expect(savedKanji[0].character).toEqual('水');
    expect(savedKanji[0].meaning).toEqual('water');
    expect(savedKanji[0].kun_reading).toEqual('みず');
    expect(savedKanji[0].on_reading).toEqual('スイ');
    expect(savedKanji[0].romaji).toEqual('mizu');
    expect(savedKanji[0].jlpt_level).toEqual('N5');
    expect(savedKanji[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate kanji characters', async () => {
    // Create first kanji
    await createKanji(testInput);

    // Attempt to create duplicate
    const duplicateInput: CreateKanjiInput = {
      ...testInput,
      meaning: 'different meaning' // Different meaning but same character
    };

    await expect(createKanji(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different JLPT levels', async () => {
    const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    const testKanji = ['一', '二', '三', '四', '五'];

    for (let i = 0; i < jlptLevels.length; i++) {
      const input: CreateKanjiInput = {
        character: testKanji[i],
        meaning: `number ${i + 1}`,
        kun_reading: null,
        on_reading: null,
        romaji: null,
        jlpt_level: jlptLevels[i]
      };

      const result = await createKanji(input);
      expect(result.jlpt_level).toEqual(jlptLevels[i]);
    }

    // Verify all were created
    const allKanji = await db.select().from(kanjiTable).execute();
    expect(allKanji).toHaveLength(5);
  });

  it('should handle kanji with only kun reading', async () => {
    const kunOnlyInput: CreateKanjiInput = {
      character: '山',
      meaning: 'mountain',
      kun_reading: 'やま',
      on_reading: null,
      romaji: 'yama',
      jlpt_level: 'N5'
    };

    const result = await createKanji(kunOnlyInput);
    expect(result.kun_reading).toEqual('やま');
    expect(result.on_reading).toBeNull();
    expect(result.romaji).toEqual('yama');
  });

  it('should handle kanji with only on reading', async () => {
    const onOnlyInput: CreateKanjiInput = {
      character: '学',
      meaning: 'study',
      kun_reading: null,
      on_reading: 'ガク',
      romaji: null,
      jlpt_level: 'N3'
    };

    const result = await createKanji(onOnlyInput);
    expect(result.kun_reading).toBeNull();
    expect(result.on_reading).toEqual('ガク');
    expect(result.romaji).toBeNull();
  });

  it('should preserve character uniqueness across different JLPT levels', async () => {
    // Try to create same character with different JLPT level
    await createKanji(testInput);

    const duplicateWithDifferentLevel: CreateKanjiInput = {
      ...testInput,
      jlpt_level: 'N4' // Different level
    };

    await expect(createKanji(duplicateWithDifferentLevel)).rejects.toThrow(/already exists/i);
  });
});
