import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test inputs for different scenarios
const testInput: CreateKanjiInput = {
  character: '水',
  meaning: 'water',
  kun_reading: 'みず',
  on_reading: 'スイ',
  jlpt_level: 'N5',
  stroke_count: 4
};

const testInputWithNulls: CreateKanjiInput = {
  character: '一',
  meaning: 'one',
  kun_reading: null,
  on_reading: 'イチ',
  jlpt_level: 'N5',
  stroke_count: 1
};

const advancedKanji: CreateKanjiInput = {
  character: '憂',
  meaning: 'melancholy, grieve, lament',
  kun_reading: 'うれ.える、うれ.い、う.い',
  on_reading: 'ユウ',
  jlpt_level: 'N1',
  stroke_count: 15
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji with all fields', async () => {
    const result = await createKanji(testInput);

    // Basic field validation
    expect(result.character).toEqual('水');
    expect(result.meaning).toEqual('water');
    expect(result.kun_reading).toEqual('みず');
    expect(result.on_reading).toEqual('スイ');
    expect(result.jlpt_level).toEqual('N5');
    expect(result.stroke_count).toEqual(4);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a kanji with nullable readings', async () => {
    const result = await createKanji(testInputWithNulls);

    expect(result.character).toEqual('一');
    expect(result.meaning).toEqual('one');
    expect(result.kun_reading).toBeNull();
    expect(result.on_reading).toEqual('イチ');
    expect(result.jlpt_level).toEqual('N5');
    expect(result.stroke_count).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testInput);

    // Query using proper drizzle syntax
    const kanjis = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(kanjis).toHaveLength(1);
    const kanji = kanjis[0];
    expect(kanji.character).toEqual('水');
    expect(kanji.meaning).toEqual('water');
    expect(kanji.kun_reading).toEqual('みず');
    expect(kanji.on_reading).toEqual('スイ');
    expect(kanji.jlpt_level).toEqual('N5');
    expect(kanji.stroke_count).toEqual(4);
    expect(kanji.created_at).toBeInstanceOf(Date);
  });

  it('should handle advanced kanji with complex readings', async () => {
    const result = await createKanji(advancedKanji);

    expect(result.character).toEqual('憂');
    expect(result.meaning).toEqual('melancholy, grieve, lament');
    expect(result.kun_reading).toEqual('うれ.える、うれ.い、う.い');
    expect(result.on_reading).toEqual('ユウ');
    expect(result.jlpt_level).toEqual('N1');
    expect(result.stroke_count).toEqual(15);

    // Verify in database
    const dbRecord = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.character, '憂'))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].meaning).toEqual('melancholy, grieve, lament');
  });

  it('should create multiple unique kanji', async () => {
    const kanji1 = await createKanji(testInput);
    const kanji2 = await createKanji({
      ...testInput,
      character: '火',
      meaning: 'fire'
    });

    expect(kanji1.id).not.toEqual(kanji2.id);
    expect(kanji1.character).toEqual('水');
    expect(kanji2.character).toEqual('火');

    // Verify both exist in database
    const allKanji = await db.select()
      .from(kanjiTable)
      .execute();

    expect(allKanji).toHaveLength(2);
    const characters = allKanji.map(k => k.character);
    expect(characters).toContain('水');
    expect(characters).toContain('火');
  });

  it('should reject duplicate kanji characters', async () => {
    await createKanji(testInput);

    // Attempt to create the same kanji character again
    await expect(createKanji(testInput))
      .rejects.toThrow(/unique/i);
  });

  it('should handle all JLPT levels correctly', async () => {
    const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    
    for (let i = 0; i < jlptLevels.length; i++) {
      const level = jlptLevels[i];
      const kanji = await createKanji({
        character: String.fromCharCode(0x4E00 + i), // Different unicode kanji
        meaning: `test kanji ${level}`,
        kun_reading: 'test',
        on_reading: 'TEST',
        jlpt_level: level,
        stroke_count: i + 1
      });

      expect(kanji.jlpt_level).toEqual(level);
    }

    // Verify all levels were saved
    const allKanji = await db.select()
      .from(kanjiTable)
      .execute();

    expect(allKanji).toHaveLength(5);
    const levels = allKanji.map(k => k.jlpt_level).sort();
    expect(levels).toEqual(['N1', 'N2', 'N3', 'N4', 'N5']);
  });
});
