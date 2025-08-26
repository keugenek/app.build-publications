import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { getAllKanji } from '../handlers/get_all_kanji';

// Test kanji data
const testKanji: CreateKanjiInput[] = [
  {
    character: '水',
    meaning: 'water',
    on_reading: 'スイ',
    kun_reading: 'みず',
    jlpt_level: 'N5'
  },
  {
    character: '火',
    meaning: 'fire',
    on_reading: 'カ',
    kun_reading: 'ひ',
    jlpt_level: 'N5'
  },
  {
    character: '木',
    meaning: 'tree, wood',
    on_reading: 'モク、ボク',
    kun_reading: 'き',
    jlpt_level: 'N5'
  },
  {
    character: '金',
    meaning: 'gold, money',
    on_reading: 'キン、コン',
    kun_reading: 'かね',
    jlpt_level: 'N5'
  },
  {
    character: '土',
    meaning: 'earth, soil',
    on_reading: 'ド、ト',
    kun_reading: 'つち',
    jlpt_level: 'N5'
  }
];

describe('getAllKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no kanji exist', async () => {
    const result = await getAllKanji();
    expect(result).toEqual([]);
  });

  it('should return all kanji when they exist', async () => {
    // Insert test kanji
    await db.insert(kanjiTable).values(testKanji).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(5);
    
    // Check that all kanji are returned with correct structure
    const characters = result.map(k => k.character);
    expect(characters).toContain('水');
    expect(characters).toContain('火');
    expect(characters).toContain('木');
    expect(characters).toContain('金');
    expect(characters).toContain('土');

    // Validate structure of first kanji
    const firstKanji = result[0];
    expect(firstKanji.id).toBeDefined();
    expect(typeof firstKanji.character).toBe('string');
    expect(typeof firstKanji.meaning).toBe('string');
    expect(firstKanji.jlpt_level).toBeDefined();
    expect(firstKanji.created_at).toBeInstanceOf(Date);
  });

  it('should return kanji ordered by creation date (newest first)', async () => {
    // Insert kanji with slight delays to ensure different timestamps
    await db.insert(kanjiTable).values([testKanji[0]]).execute();
    
    // Small delay to ensure different created_at times
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(kanjiTable).values([testKanji[1]]).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(2);
    
    // The second kanji should be first (newest)
    expect(result[0].character).toBe('火');
    expect(result[1].character).toBe('水');
    
    // Verify ordering by created_at
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle kanji with null readings correctly', async () => {
    const kanjiWithNullReadings: CreateKanjiInput = {
      character: '々',
      meaning: 'repetition mark',
      on_reading: null,
      kun_reading: null,
      jlpt_level: 'N5'
    };

    await db.insert(kanjiTable).values([kanjiWithNullReadings]).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(1);
    expect(result[0].character).toBe('々');
    expect(result[0].meaning).toBe('repetition mark');
    expect(result[0].on_reading).toBeNull();
    expect(result[0].kun_reading).toBeNull();
    expect(result[0].jlpt_level).toBe('N5');
  });

  it('should handle different JLPT levels correctly', async () => {
    const multiLevelKanji: CreateKanjiInput[] = [
      {
        character: '人',
        meaning: 'person',
        on_reading: 'ジン、ニン',
        kun_reading: 'ひと',
        jlpt_level: 'N5'
      },
      {
        character: '話',
        meaning: 'talk, speak',
        on_reading: 'ワ',
        kun_reading: 'はな.す、はなし',
        jlpt_level: 'N4'
      },
      {
        character: '経験',
        meaning: 'experience',
        on_reading: 'ケイケン',
        kun_reading: null,
        jlpt_level: 'N3'
      }
    ];

    await db.insert(kanjiTable).values(multiLevelKanji).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(3);
    
    const levels = result.map(k => k.jlpt_level);
    expect(levels).toContain('N5');
    expect(levels).toContain('N4');
    expect(levels).toContain('N3');
  });

  it('should preserve all kanji fields correctly', async () => {
    const detailedKanji: CreateKanjiInput = {
      character: '学',
      meaning: 'study, learning, school',
      on_reading: 'ガク',
      kun_reading: 'まな.ぶ',
      jlpt_level: 'N5'
    };

    await db.insert(kanjiTable).values([detailedKanji]).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(1);
    const kanji = result[0];
    
    expect(kanji.character).toBe('学');
    expect(kanji.meaning).toBe('study, learning, school');
    expect(kanji.on_reading).toBe('ガク');
    expect(kanji.kun_reading).toBe('まな.ぶ');
    expect(kanji.jlpt_level).toBe('N5');
    expect(kanji.id).toBeDefined();
    expect(kanji.created_at).toBeInstanceOf(Date);
  });
});
