import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type GetKanjiQuery, type CreateKanjiInput } from '../schema';
import { getKanji } from '../handlers/get_kanji';

// Test kanji data
const testKanji: CreateKanjiInput[] = [
  {
    character: '水',
    meaning: 'water',
    kun_reading: 'みず',
    on_reading: 'スイ',
    jlpt_level: 'N5',
    stroke_count: 4
  },
  {
    character: '火',
    meaning: 'fire',
    kun_reading: 'ひ',
    on_reading: 'カ',
    jlpt_level: 'N5',
    stroke_count: 4
  },
  {
    character: '学',
    meaning: 'study',
    kun_reading: 'まな.ぶ',
    on_reading: 'ガク',
    jlpt_level: 'N4',
    stroke_count: 8
  },
  {
    character: '意',
    meaning: 'meaning',
    kun_reading: null,
    on_reading: 'イ',
    jlpt_level: 'N3',
    stroke_count: 13
  }
];

describe('getKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test kanji
  const createTestKanji = async () => {
    return await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();
  };

  it('should return all kanji when no filters applied', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      limit: 20,
      offset: 0
    };

    const result = await getKanji(query);

    expect(result).toHaveLength(4);
    expect(result[0].character).toBeDefined();
    expect(result[0].meaning).toBeDefined();
    expect(result[0].jlpt_level).toBeDefined();
    expect(result[0].stroke_count).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter kanji by JLPT level', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      jlpt_level: 'N5',
      limit: 20,
      offset: 0
    };

    const result = await getKanji(query);

    expect(result).toHaveLength(2);
    result.forEach(kanji => {
      expect(kanji.jlpt_level).toEqual('N5');
    });
    
    // Verify specific characters
    const characters = result.map(k => k.character);
    expect(characters).toContain('水');
    expect(characters).toContain('火');
  });

  it('should filter kanji by different JLPT levels', async () => {
    await createTestKanji();

    // Test N4 level
    const n4Query: GetKanjiQuery = {
      jlpt_level: 'N4',
      limit: 20,
      offset: 0
    };

    const n4Result = await getKanji(n4Query);
    expect(n4Result).toHaveLength(1);
    expect(n4Result[0].character).toEqual('学');
    expect(n4Result[0].jlpt_level).toEqual('N4');

    // Test N3 level
    const n3Query: GetKanjiQuery = {
      jlpt_level: 'N3',
      limit: 20,
      offset: 0
    };

    const n3Result = await getKanji(n3Query);
    expect(n3Result).toHaveLength(1);
    expect(n3Result[0].character).toEqual('意');
    expect(n3Result[0].jlpt_level).toEqual('N3');
  });

  it('should return empty array for non-existent JLPT level', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      jlpt_level: 'N1',
      limit: 20,
      offset: 0
    };

    const result = await getKanji(query);
    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      limit: 2,
      offset: 0
    };

    const result = await getKanji(query);
    expect(result).toHaveLength(2);
  });

  it('should respect offset parameter', async () => {
    const createdKanji = await createTestKanji();

    // Get first 2 kanji
    const firstQuery: GetKanjiQuery = {
      limit: 2,
      offset: 0
    };

    const firstResult = await getKanji(firstQuery);
    expect(firstResult).toHaveLength(2);

    // Get next 2 kanji using offset
    const secondQuery: GetKanjiQuery = {
      limit: 2,
      offset: 2
    };

    const secondResult = await getKanji(secondQuery);
    expect(secondResult).toHaveLength(2);

    // Verify different results
    expect(firstResult[0].id).not.toEqual(secondResult[0].id);
    expect(firstResult[1].id).not.toEqual(secondResult[1].id);
  });

  it('should combine JLPT filter with pagination', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      jlpt_level: 'N5',
      limit: 1,
      offset: 0
    };

    const result = await getKanji(query);
    expect(result).toHaveLength(1);
    expect(result[0].jlpt_level).toEqual('N5');

    // Get second N5 kanji
    const query2: GetKanjiQuery = {
      jlpt_level: 'N5',
      limit: 1,
      offset: 1
    };

    const result2 = await getKanji(query2);
    expect(result2).toHaveLength(1);
    expect(result2[0].jlpt_level).toEqual('N5');
    expect(result2[0].id).not.toEqual(result[0].id);
  });

  it('should return empty array when offset exceeds available records', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      limit: 10,
      offset: 100
    };

    const result = await getKanji(query);
    expect(result).toHaveLength(0);
  });

  it('should handle kanji with null readings correctly', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      jlpt_level: 'N3',
      limit: 20,
      offset: 0
    };

    const result = await getKanji(query);
    expect(result).toHaveLength(1);
    
    const kanji = result[0];
    expect(kanji.character).toEqual('意');
    expect(kanji.meaning).toEqual('meaning');
    expect(kanji.kun_reading).toBeNull();
    expect(kanji.on_reading).toEqual('イ');
  });

  it('should maintain consistent field types', async () => {
    await createTestKanji();

    const query: GetKanjiQuery = {
      limit: 1,
      offset: 0
    };

    const result = await getKanji(query);
    expect(result).toHaveLength(1);

    const kanji = result[0];
    expect(typeof kanji.id).toBe('number');
    expect(typeof kanji.character).toBe('string');
    expect(typeof kanji.meaning).toBe('string');
    expect(typeof kanji.stroke_count).toBe('number');
    expect(kanji.created_at).toBeInstanceOf(Date);
    
    // Readings can be string or null
    if (kanji.kun_reading !== null) {
      expect(typeof kanji.kun_reading).toBe('string');
    }
    if (kanji.on_reading !== null) {
      expect(typeof kanji.on_reading).toBe('string');
    }
  });
});
