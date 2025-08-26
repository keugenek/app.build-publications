import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type GetKanjiByLevelInput } from '../schema';
import { getKanjiByLevel } from '../handlers/get_kanji_by_level';

// Test data
const testKanjiN5 = [
  {
    character: '一',
    meaning: 'one',
    kunReading: 'ひと*',
    onReading: 'いち',
    jlptLevel: 'N5' as const,
  },
  {
    character: '二',
    meaning: 'two',
    kunReading: 'ふた*',
    onReading: 'に',
    jlptLevel: 'N5' as const,
  }
];

const testKanjiN4 = [
  {
    character: '学',
    meaning: 'study',
    kunReading: 'まな*',
    onReading: 'がく',
    jlptLevel: 'N4' as const,
  }
];

describe('getKanjiByLevel', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(kanjiTable).values([...testKanjiN5, ...testKanjiN4]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch kanji by JLPT level N5', async () => {
    const input: GetKanjiByLevelInput = { jlptLevel: 'N5' };
    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      character: '一',
      meaning: 'one',
      jlptLevel: 'N5'
    });
    expect(result[1]).toMatchObject({
      character: '二',
      meaning: 'two',
      jlptLevel: 'N5'
    });
    
    // Check that N4 kanji is not included
    const n4Kanji = result.find(k => k.jlptLevel === 'N4');
    expect(n4Kanji).toBeUndefined();
  });

  it('should fetch kanji by JLPT level N4', async () => {
    const input: GetKanjiByLevelInput = { jlptLevel: 'N4' };
    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      character: '学',
      meaning: 'study',
      jlptLevel: 'N4'
    });
  });

  it('should return empty array for non-existent JLPT level', async () => {
    const input: GetKanjiByLevelInput = { jlptLevel: 'N1' };
    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(0);
  });

  it('should have proper kanji object structure', async () => {
    const input: GetKanjiByLevelInput = { jlptLevel: 'N5' };
    const result = await getKanjiByLevel(input);
    
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('character');
    expect(result[0]).toHaveProperty('meaning');
    expect(result[0]).toHaveProperty('jlptLevel');
    expect(result[0]).toHaveProperty('created_at');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
