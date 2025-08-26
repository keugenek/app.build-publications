import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjisTable } from '../db/schema';
import { type Kanji } from '../schema';
import { getKanjis } from '../handlers/get_kanjis';
import { eq } from 'drizzle-orm';

// Sample kanji data for testing
const testKanji1: Omit<Kanji, 'id' | 'created_at'> = {
  character: '日',
  meaning: 'sun/day',
  onyomi: 'ニチ',
  kunyomi: 'ひ',
  jlpt_level: 'N5' as const,
};

const testKanji2: Omit<Kanji, 'id' | 'created_at'> = {
  character: '月',
  meaning: 'moon/month',
  onyomi: 'ゲツ',
  kunyomi: 'つき',
  jlpt_level: 'N5' as const,
};

describe('getKanjis handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when there are no kanji records', async () => {
    const result = await getKanjis();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all kanji records from the database', async () => {
    // Insert test kanji records
    await db.insert(kanjisTable).values([testKanji1, testKanji2]).execute();

    const result = await getKanjis();

    // Verify both records are returned
    expect(result).toHaveLength(2);

    // Helper to find a kanji by character
    const findByChar = (char: string) => result.find((k) => k.character === char);

    const kanji1 = findByChar('日');
    const kanji2 = findByChar('月');

    expect(kanji1).toBeDefined();
    expect(kanji1?.meaning).toBe('sun/day');
    expect(kanji1?.onyomi).toBe('ニチ');
    expect(kanji1?.kunyomi).toBe('ひ');
    expect(kanji1?.jlpt_level).toBe('N5');
    expect(kanji1?.id).toBeDefined();
    expect(kanji1?.created_at).toBeInstanceOf(Date);

    expect(kanji2).toBeDefined();
    expect(kanji2?.meaning).toBe('moon/month');
    expect(kanji2?.onyomi).toBe('ゲツ');
    expect(kanji2?.kunyomi).toBe('つき');
    expect(kanji2?.jlpt_level).toBe('N5');
    expect(kanji2?.id).toBeDefined();
    expect(kanji2?.created_at).toBeInstanceOf(Date);
  });
});
