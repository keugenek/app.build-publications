import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { srsEntriesTable, kanjiTable } from '../db/schema';
import { type CreateSrsEntryInput } from '../schema';
import { createSrsEntry } from '../handlers/create_srs_entry';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateSrsEntryInput = {
  user_id: 1,
  kanji_id: 1,
  familiarity_level: 3,
  next_review_date: new Date('2023-12-01')
};

// Test kanji data
const testKanji = {
  kanji: '一',
  meaning: 'one',
  onyomi: 'いち',
  kunyomi: 'ひと',
  jlpt_level: 'N5' as const
};

describe('createSrsEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test kanji first since srs_entries references kanji
    await db.insert(kanjiTable).values(testKanji).execute();
  });
  
  afterEach(resetDB);

  it('should create an SRS entry', async () => {
    const result = await createSrsEntry(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.kanji_id).toEqual(testInput.kanji_id);
    expect(result.familiarity_level).toEqual(testInput.familiarity_level);
    expect(result.next_review_date).toEqual(testInput.next_review_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_reviewed_at).toBeNull();
  });

  it('should save SRS entry to database', async () => {
    const result = await createSrsEntry(testInput);

    // Query the database to verify the entry was saved
    const entries = await db.select()
      .from(srsEntriesTable)
      .where(eq(srsEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toEqual(testInput.user_id);
    expect(entries[0].kanji_id).toEqual(testInput.kanji_id);
    expect(entries[0].familiarity_level).toEqual(testInput.familiarity_level);
    // Date comparison - database stores as string, so convert for comparison
    expect(new Date(entries[0].next_review_date)).toEqual(testInput.next_review_date);
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].last_reviewed_at).toBeNull();
  });

  it('should create SRS entry with provided values', async () => {
    // Test with all required fields provided
    const input: CreateSrsEntryInput = {
      user_id: 2,
      kanji_id: 1,
      familiarity_level: 0, // Explicitly provide the value
      next_review_date: new Date('2023-12-02')
    };

    const result = await createSrsEntry(input);
    
    expect(result.familiarity_level).toEqual(0);
    expect(result.user_id).toEqual(input.user_id);
    expect(result.kanji_id).toEqual(input.kanji_id);
    expect(result.next_review_date).toEqual(input.next_review_date);
  });
});
