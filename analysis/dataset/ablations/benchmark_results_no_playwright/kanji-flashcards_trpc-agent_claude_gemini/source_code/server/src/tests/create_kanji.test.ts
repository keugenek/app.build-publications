import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test inputs for different JLPT levels
const testKanjiN5: CreateKanjiInput = {
  character: '人',
  meaning_english: 'person, human',
  reading_hiragana: 'ひと、じん、にん',
  reading_katakana: null,
  jlpt_level: 'N5'
};

const testKanjiN1: CreateKanjiInput = {
  character: '憂',
  meaning_english: 'melancholy, grieve, lament, be anxious',
  reading_hiragana: 'うれ・える、うれ・い',
  reading_katakana: null,
  jlpt_level: 'N1'
};

const testKanjiWithKatakana: CreateKanjiInput = {
  character: '画',
  meaning_english: 'brush stroke, picture',
  reading_hiragana: 'え、かく',
  reading_katakana: 'ガ',
  jlpt_level: 'N3'
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji with basic fields', async () => {
    const result = await createKanji(testKanjiN5);

    expect(result.character).toEqual('人');
    expect(result.meaning_english).toEqual('person, human');
    expect(result.reading_hiragana).toEqual('ひと、じん、にん');
    expect(result.reading_katakana).toBeNull();
    expect(result.jlpt_level).toEqual('N5');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a kanji with katakana reading', async () => {
    const result = await createKanji(testKanjiWithKatakana);

    expect(result.character).toEqual('画');
    expect(result.meaning_english).toEqual('brush stroke, picture');
    expect(result.reading_hiragana).toEqual('え、かく');
    expect(result.reading_katakana).toEqual('ガ');
    expect(result.jlpt_level).toEqual('N3');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testKanjiN1);

    // Query the database to verify the kanji was saved
    const savedKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(savedKanji).toHaveLength(1);
    expect(savedKanji[0].character).toEqual('憂');
    expect(savedKanji[0].meaning_english).toEqual('melancholy, grieve, lament, be anxious');
    expect(savedKanji[0].reading_hiragana).toEqual('うれ・える、うれ・い');
    expect(savedKanji[0].reading_katakana).toBeNull();
    expect(savedKanji[0].jlpt_level).toEqual('N1');
    expect(savedKanji[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple different kanji successfully', async () => {
    const result1 = await createKanji(testKanjiN5);
    const result2 = await createKanji(testKanjiN1);
    const result3 = await createKanji(testKanjiWithKatakana);

    // Verify all have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).not.toEqual(result3.id);
    expect(result1.id).not.toEqual(result3.id);

    // Verify all were saved to database
    const allKanji = await db.select()
      .from(kanjiTable)
      .execute();

    expect(allKanji).toHaveLength(3);
    
    const characters = allKanji.map(k => k.character);
    expect(characters).toContain('人');
    expect(characters).toContain('憂');
    expect(characters).toContain('画');
  });

  it('should reject duplicate kanji characters', async () => {
    // Create the first kanji
    await createKanji(testKanjiN5);

    // Attempt to create the same character again
    const duplicateInput: CreateKanjiInput = {
      character: '人',
      meaning_english: 'different meaning',
      reading_hiragana: 'different reading',
      reading_katakana: null,
      jlpt_level: 'N4'
    };

    await expect(createKanji(duplicateInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should handle different JLPT levels correctly', async () => {
    const kanjiN5: CreateKanjiInput = {
      character: '大',
      meaning_english: 'large, big',
      reading_hiragana: 'おお・きい、だい、たい',
      reading_katakana: null,
      jlpt_level: 'N5'
    };

    const kanjiN2: CreateKanjiInput = {
      character: '恩',
      meaning_english: 'grace, kindness, goodness, favor',
      reading_hiragana: 'おん',
      reading_katakana: null,
      jlpt_level: 'N2'
    };

    const resultN5 = await createKanji(kanjiN5);
    const resultN2 = await createKanji(kanjiN2);

    expect(resultN5.jlpt_level).toEqual('N5');
    expect(resultN2.jlpt_level).toEqual('N2');

    // Verify in database
    const savedKanji = await db.select()
      .from(kanjiTable)
      .execute();

    const jlptLevels = savedKanji.map(k => k.jlpt_level);
    expect(jlptLevels).toContain('N5');
    expect(jlptLevels).toContain('N2');
  });

  it('should handle null katakana reading correctly', async () => {
    const kanjiWithoutKatakana: CreateKanjiInput = {
      character: '花',
      meaning_english: 'flower',
      reading_hiragana: 'はな',
      reading_katakana: null,
      jlpt_level: 'N4'
    };

    const result = await createKanji(kanjiWithoutKatakana);

    expect(result.reading_katakana).toBeNull();

    // Verify in database
    const savedKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(savedKanji[0].reading_katakana).toBeNull();
  });
});
