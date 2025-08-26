import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { kanjisTable } from '../db/schema';
import { type KanjisByLevelInput } from '../schema';
import { getKanjisByLevel } from '../handlers/get_kanjis_by_level';
import { eq } from 'drizzle-orm';

/**
 * Helper to seed kanji entries for tests.
 */
const seedKanji = async () => {
  const kanjis = [
    {
      character: '日',
      meaning: 'day/sun',
      onyomi: 'ニチ, ジツ',
      kunyomi: 'ひ, -び, -か',
      jlpt_level: 1,
    },
    {
      character: '月',
      meaning: 'moon/month',
      onyomi: 'ゲツ, ガツ',
      kunyomi: 'つき',
      jlpt_level: 1,
    },
    {
      character: '火',
      meaning: 'fire',
      onyomi: 'カ',
      kunyomi: 'ひ, -び, ほ-',
      jlpt_level: 3,
    },
    {
      character: '水',
      meaning: 'water',
      onyomi: 'スイ',
      kunyomi: 'みず, みず-',
      jlpt_level: 3,
    },
  ];

  // Insert all kanjis and return inserted rows (including id & created_at)
  const inserted = await db
    .insert(kanjisTable)
    .values(kanjis as any)
    .returning()
    .execute();
  return inserted;
};

describe('getKanjisByLevel handler', () => {
  beforeEach(async () => {
    await createDB();
    await seedKanji();
  });
  afterEach(resetDB);

  it('should return kanjis matching the requested JLPT level', async () => {
    const input: KanjisByLevelInput = { jlpt_level: 1 };
    const result = await getKanjisByLevel(input);

    expect(result).toHaveLength(2);
    for (const kanji of result) {
      expect(kanji.jlpt_level).toBe(1);
      expect(typeof kanji.character).toBe('string');
      expect(kanji.created_at).toBeInstanceOf(Date);
    }
    const chars = result.map((k) => k.character).sort();
    expect(chars).toEqual(['月', '日'].sort());
  });

  it('should return an empty array when no kanjis match the level', async () => {
    const input: KanjisByLevelInput = { jlpt_level: 5 };
    const result = await getKanjisByLevel(input);
    expect(result).toHaveLength(0);
  });
});
