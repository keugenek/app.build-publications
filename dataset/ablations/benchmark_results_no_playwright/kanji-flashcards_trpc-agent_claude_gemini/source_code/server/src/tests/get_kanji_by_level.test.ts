import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type GetKanjiByLevelInput, type CreateKanjiInput } from '../schema';
import { getKanjiByLevel } from '../handlers/get_kanji_by_level';
import { eq } from 'drizzle-orm';

// Helper function to create test kanji
const createTestKanji = async (kanjiData: CreateKanjiInput) => {
  const result = await db.insert(kanjiTable)
    .values({
      character: kanjiData.character,
      meaning_english: kanjiData.meaning_english,
      reading_hiragana: kanjiData.reading_hiragana,
      reading_katakana: kanjiData.reading_katakana,
      jlpt_level: kanjiData.jlpt_level
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('getKanjiByLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return kanji filtered by JLPT level', async () => {
    // Create test kanji of different levels
    await createTestKanji({
      character: '人',
      meaning_english: 'person, human',
      reading_hiragana: 'ひと、じん',
      reading_katakana: null,
      jlpt_level: 'N5'
    });

    await createTestKanji({
      character: '水',
      meaning_english: 'water',
      reading_hiragana: 'みず、すい',
      reading_katakana: null,
      jlpt_level: 'N5'
    });

    await createTestKanji({
      character: '医',
      meaning_english: 'medical, doctor',
      reading_hiragana: 'い',
      reading_katakana: null,
      jlpt_level: 'N4'
    });

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      limit: 50,
      offset: 0
    };

    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(2);
    result.forEach(kanji => {
      expect(kanji.jlpt_level).toEqual('N5');
      expect(kanji.character).toMatch(/[人水]/);
      expect(kanji.id).toBeDefined();
      expect(kanji.created_at).toBeInstanceOf(Date);
    });
  });

  it('should apply pagination correctly', async () => {
    // Create multiple N5 kanji
    const testKanji = [
      { character: '人', meaning_english: 'person', reading_hiragana: 'ひと', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '水', meaning_english: 'water', reading_hiragana: 'みず', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '火', meaning_english: 'fire', reading_hiragana: 'ひ', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '土', meaning_english: 'earth', reading_hiragana: 'つち', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '木', meaning_english: 'tree', reading_hiragana: 'き', reading_katakana: null, jlpt_level: 'N5' as const }
    ];

    for (const kanji of testKanji) {
      await createTestKanji(kanji);
    }

    // Test first page
    const firstPageInput: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      limit: 2,
      offset: 0
    };

    const firstPageResult = await getKanjiByLevel(firstPageInput);
    expect(firstPageResult).toHaveLength(2);

    // Test second page
    const secondPageInput: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      limit: 2,
      offset: 2
    };

    const secondPageResult = await getKanjiByLevel(secondPageInput);
    expect(secondPageResult).toHaveLength(2);

    // Ensure no overlap between pages
    const firstPageIds = firstPageResult.map(k => k.id);
    const secondPageIds = secondPageResult.map(k => k.id);
    
    firstPageIds.forEach(id => {
      expect(secondPageIds).not.toContain(id);
    });
  });

  it('should return empty array when no kanji exist for level', async () => {
    // Create only N5 kanji
    await createTestKanji({
      character: '人',
      meaning_english: 'person',
      reading_hiragana: 'ひと',
      reading_katakana: null,
      jlpt_level: 'N5'
    });

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N1', // Query for level that has no kanji
      limit: 50,
      offset: 0
    };

    const result = await getKanjiByLevel(input);
    expect(result).toHaveLength(0);
  });

  it('should handle different JLPT levels correctly', async () => {
    // Create kanji for different levels
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    const testKanji = levels.map((level, index) => ({
      character: ['人', '医', '読', '経', '憲'][index],
      meaning_english: ['person', 'medical', 'read', 'economy', 'constitution'][index],
      reading_hiragana: ['ひと', 'い', 'よ', 'けい', 'けん'][index],
      reading_katakana: null,
      jlpt_level: level
    }));

    for (const kanji of testKanji) {
      await createTestKanji(kanji);
    }

    // Test each level individually
    for (const level of levels) {
      const input: GetKanjiByLevelInput = {
        jlpt_level: level,
        limit: 50,
        offset: 0
      };

      const result = await getKanjiByLevel(input);
      expect(result).toHaveLength(1);
      expect(result[0].jlpt_level).toEqual(level);
    }
  });

  it('should respect limit parameter', async () => {
    // Create 5 N5 kanji
    const testKanji = [
      { character: '人', meaning_english: 'person', reading_hiragana: 'ひと', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '水', meaning_english: 'water', reading_hiragana: 'みず', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '火', meaning_english: 'fire', reading_hiragana: 'ひ', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '土', meaning_english: 'earth', reading_hiragana: 'つち', reading_katakana: null, jlpt_level: 'N5' as const },
      { character: '木', meaning_english: 'tree', reading_hiragana: 'き', reading_katakana: null, jlpt_level: 'N5' as const }
    ];

    for (const kanji of testKanji) {
      await createTestKanji(kanji);
    }

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      limit: 3, // Limit to 3 results
      offset: 0
    };

    const result = await getKanjiByLevel(input);
    expect(result).toHaveLength(3);
  });

  it('should return results ordered by creation date', async () => {
    // Create kanji with slight delays to ensure different creation times
    await createTestKanji({
      character: '人',
      meaning_english: 'person',
      reading_hiragana: 'ひと',
      reading_katakana: null,
      jlpt_level: 'N5'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await createTestKanji({
      character: '水',
      meaning_english: 'water',
      reading_hiragana: 'みず',
      reading_katakana: null,
      jlpt_level: 'N5'
    });

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      limit: 50,
      offset: 0
    };

    const result = await getKanjiByLevel(input);
    expect(result).toHaveLength(2);

    // Results should be ordered by creation date (ascending)
    expect(result[0].created_at <= result[1].created_at).toBe(true);
    expect(result[0].character).toEqual('人'); // First created
    expect(result[1].character).toEqual('水'); // Second created
  });

  it('should handle kanji with katakana readings', async () => {
    await createTestKanji({
      character: '化',
      meaning_english: 'change, chemistry',
      reading_hiragana: 'か、ば',
      reading_katakana: 'ケ',
      jlpt_level: 'N4'
    });

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N4',
      limit: 50,
      offset: 0
    };

    const result = await getKanjiByLevel(input);
    expect(result).toHaveLength(1);
    expect(result[0].character).toEqual('化');
    expect(result[0].reading_katakana).toEqual('ケ');
    expect(result[0].reading_hiragana).toEqual('か、ば');
  });

  it('should save kanji to database correctly', async () => {
    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      limit: 50,
      offset: 0
    };

    await createTestKanji({
      character: '人',
      meaning_english: 'person, human',
      reading_hiragana: 'ひと、じん',
      reading_katakana: null,
      jlpt_level: 'N5'
    });

    const result = await getKanjiByLevel(input);

    // Verify the kanji was actually saved to the database
    const dbKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result[0].id))
      .execute();

    expect(dbKanji).toHaveLength(1);
    expect(dbKanji[0].character).toEqual('人');
    expect(dbKanji[0].jlpt_level).toEqual('N5');
    expect(dbKanji[0].created_at).toBeInstanceOf(Date);
  });
});
