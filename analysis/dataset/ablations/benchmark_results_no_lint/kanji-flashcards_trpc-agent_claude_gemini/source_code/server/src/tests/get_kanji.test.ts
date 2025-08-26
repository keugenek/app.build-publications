import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { getAllKanji, getKanjiByLevel, getKanjiById } from '../handlers/get_kanji';

// Test data for kanji
const testKanjiData: CreateKanjiInput[] = [
  {
    character: '水',
    meaning: 'water',
    kun_reading: 'みず',
    on_reading: 'スイ',
    romaji: 'mizu/sui',
    jlpt_level: 'N5'
  },
  {
    character: '火',
    meaning: 'fire',
    kun_reading: 'ひ',
    on_reading: 'カ',
    romaji: 'hi/ka',
    jlpt_level: 'N5'
  },
  {
    character: '学',
    meaning: 'study, learning',
    kun_reading: 'まな.ぶ',
    on_reading: 'ガク',
    romaji: 'manab-u/gaku',
    jlpt_level: 'N4'
  },
  {
    character: '生',
    meaning: 'life, birth',
    kun_reading: 'い.きる',
    on_reading: 'セイ',
    romaji: 'ik-iru/sei',
    jlpt_level: 'N4'
  },
  {
    character: '情',
    meaning: 'emotion, feeling',
    kun_reading: 'なさ.け',
    on_reading: 'ジョウ',
    romaji: 'nasake/jou',
    jlpt_level: 'N2'
  }
];

describe('get_kanji handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getAllKanji', () => {
    it('should return empty array when no kanji exist', async () => {
      const result = await getAllKanji();
      expect(result).toEqual([]);
    });

    it('should return all kanji when they exist', async () => {
      // Insert test data
      await db.insert(kanjiTable)
        .values(testKanjiData)
        .execute();

      const result = await getAllKanji();

      expect(result).toHaveLength(5);
      
      // Check that all kanji are returned
      const characters = result.map(k => k.character);
      expect(characters).toContain('水');
      expect(characters).toContain('火');
      expect(characters).toContain('学');
      expect(characters).toContain('生');
      expect(characters).toContain('情');

      // Verify structure of returned kanji
      result.forEach(kanji => {
        expect(kanji.id).toBeDefined();
        expect(typeof kanji.character).toBe('string');
        expect(typeof kanji.meaning).toBe('string');
        expect(kanji.jlpt_level).toMatch(/^N[1-5]$/);
        expect(kanji.created_at).toBeInstanceOf(Date);
      });
    });
  });

  describe('getKanjiByLevel', () => {
    beforeEach(async () => {
      // Insert test data for each test
      await db.insert(kanjiTable)
        .values(testKanjiData)
        .execute();
    });

    it('should return empty array for level with no kanji', async () => {
      const result = await getKanjiByLevel('N1');
      expect(result).toEqual([]);
    });

    it('should return only N5 kanji when filtering by N5', async () => {
      const result = await getKanjiByLevel('N5');

      expect(result).toHaveLength(2);
      
      const characters = result.map(k => k.character);
      expect(characters).toContain('水');
      expect(characters).toContain('火');
      expect(characters).not.toContain('学');
      expect(characters).not.toContain('生');
      expect(characters).not.toContain('情');

      // Verify all returned kanji are N5
      result.forEach(kanji => {
        expect(kanji.jlpt_level).toBe('N5');
      });
    });

    it('should return only N4 kanji when filtering by N4', async () => {
      const result = await getKanjiByLevel('N4');

      expect(result).toHaveLength(2);
      
      const characters = result.map(k => k.character);
      expect(characters).toContain('学');
      expect(characters).toContain('生');
      expect(characters).not.toContain('水');
      expect(characters).not.toContain('火');
      expect(characters).not.toContain('情');

      // Verify all returned kanji are N4
      result.forEach(kanji => {
        expect(kanji.jlpt_level).toBe('N4');
      });
    });

    it('should return only N2 kanji when filtering by N2', async () => {
      const result = await getKanjiByLevel('N2');

      expect(result).toHaveLength(1);
      expect(result[0].character).toBe('情');
      expect(result[0].jlpt_level).toBe('N2');
    });

    it('should handle all JLPT levels correctly', async () => {
      // Test each level exists in our enum
      const levels = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;
      
      for (const level of levels) {
        const result = await getKanjiByLevel(level);
        expect(Array.isArray(result)).toBe(true);
        
        // If results exist, they should all have the correct level
        result.forEach(kanji => {
          expect(kanji.jlpt_level).toBe(level);
        });
      }
    });
  });

  describe('getKanjiById', () => {
    it('should return null for non-existent id', async () => {
      const result = await getKanjiById(999);
      expect(result).toBeNull();
    });

    it('should return kanji when id exists', async () => {
      // Insert test data
      const insertResult = await db.insert(kanjiTable)
        .values([testKanjiData[0]]) // Just insert one kanji
        .returning()
        .execute();

      const insertedKanji = insertResult[0];
      const result = await getKanjiById(insertedKanji.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(insertedKanji.id);
      expect(result!.character).toBe('水');
      expect(result!.meaning).toBe('water');
      expect(result!.kun_reading).toBe('みず');
      expect(result!.on_reading).toBe('スイ');
      expect(result!.romaji).toBe('mizu/sui');
      expect(result!.jlpt_level).toBe('N5');
      expect(result!.created_at).toBeInstanceOf(Date);
    });

    it('should return correct kanji among multiple', async () => {
      // Insert multiple kanji
      const insertResults = await db.insert(kanjiTable)
        .values(testKanjiData)
        .returning()
        .execute();

      // Get a specific kanji by id
      const targetKanji = insertResults[2]; // Should be '学'
      const result = await getKanjiById(targetKanji.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(targetKanji.id);
      expect(result!.character).toBe('学');
      expect(result!.meaning).toBe('study, learning');
      expect(result!.jlpt_level).toBe('N4');
    });

    it('should handle kanji with null readings', async () => {
      // Insert kanji with some null values
      const kanjiWithNulls = {
        character: '人',
        meaning: 'person',
        kun_reading: null,
        on_reading: 'ジン',
        romaji: null,
        jlpt_level: 'N5' as const
      };

      const insertResult = await db.insert(kanjiTable)
        .values([kanjiWithNulls])
        .returning()
        .execute();

      const result = await getKanjiById(insertResult[0].id);

      expect(result).not.toBeNull();
      expect(result!.character).toBe('人');
      expect(result!.kun_reading).toBeNull();
      expect(result!.on_reading).toBe('ジン');
      expect(result!.romaji).toBeNull();
    });
  });
});
