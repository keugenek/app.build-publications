import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { kanjis } from '../db/schema';
import { type Kanji } from '../schema';
import { createDB, resetDB } from '../helpers';
import { getKanjis } from '../handlers/get_kanjis';
import { eq } from 'drizzle-orm';

describe('getKanjis handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns empty array when no kanjis exist', async () => {
    const result = await getKanjis();
    expect(result).toEqual([]);
  });

  it('returns kanjis after insertion', async () => {
    // Insert a kanji directly via db
    const insertResult = await db.insert(kanjis).values({
      character: '水',
      meaning: 'water',
      reading: 'みず',
      jlpt_level: 5
    }).returning().execute();

    const inserted = insertResult[0];
    // Ensure insertion succeeded
    expect(inserted.id).toBeDefined();

    const result = await getKanjis();
    expect(result).toHaveLength(1);
    const kanji = result[0];
    expect(kanji.id).toEqual(inserted.id);
    expect(kanji.character).toBe('水');
    expect(kanji.meaning).toBe('water');
    expect(kanji.reading).toBe('みず');
    expect(kanji.jlpt_level).toBe(5);
    expect(kanji.created_at).toBeInstanceOf(Date);
  });
});
