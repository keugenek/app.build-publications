import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { getKanji } from '../handlers/get_kanji';
import { eq } from 'drizzle-orm';

// Test data
const testKanjiList: CreateKanjiInput[] = [
  {
    kanji: '一',
    meaning: 'one',
    onyomi: 'イチ',
    kunyomi: 'ひと',
    jlpt_level: 'N5'
  },
  {
    kanji: '二',
    meaning: 'two',
    onyomi: 'ニ',
    kunyomi: 'ふた',
    jlpt_level: 'N5'
  },
  {
    kanji: '三',
    meaning: 'three',
    onyomi: 'サン',
    kunyomi: 'み',
    jlpt_level: 'N5'
  }
];

describe('getKanji', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const kanji of testKanjiList) {
      await db.insert(kanjiTable).values(kanji).execute();
    }
  });
  
  afterEach(resetDB);

  it('should fetch all kanji from the database', async () => {
    const result = await getKanji();

    expect(result).toHaveLength(3);
    
    // Check that all expected kanji are returned
    const kanjiChars = result.map(k => k.kanji);
    expect(kanjiChars).toContain('一');
    expect(kanjiChars).toContain('二');
    expect(kanjiChars).toContain('三');
    
    // Check that all fields are properly returned
    const firstKanji = result.find(k => k.kanji === '一');
    expect(firstKanji).toBeDefined();
    expect(firstKanji?.meaning).toEqual('one');
    expect(firstKanji?.onyomi).toEqual('イチ');
    expect(firstKanji?.kunyomi).toEqual('ひと');
    expect(firstKanji?.jlpt_level).toEqual('N5');
    expect(firstKanji?.id).toBeDefined();
    expect(firstKanji?.created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when no kanji exist', async () => {
    // Clear the database
    await db.delete(kanjiTable).execute();
    
    const result = await getKanji();
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle kanji with null readings correctly', async () => {
    // Insert a kanji with null readings
    const kanjiWithNullReadings: CreateKanjiInput = {
      kanji: '々',
      meaning: 'repetition',
      onyomi: null,
      kunyomi: null,
      jlpt_level: 'N3'
    };
    
    await db.insert(kanjiTable).values(kanjiWithNullReadings).execute();
    
    const result = await getKanji();
    expect(result).toHaveLength(4);
    
    const specialKanji = result.find(k => k.kanji === '々');
    expect(specialKanji).toBeDefined();
    expect(specialKanji?.onyomi).toBeNull();
    expect(specialKanji?.kunyomi).toBeNull();
  });
});
