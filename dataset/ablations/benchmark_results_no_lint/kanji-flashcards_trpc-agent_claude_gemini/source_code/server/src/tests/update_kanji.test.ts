import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type UpdateKanjiInput } from '../schema';
import { updateKanji, deleteKanji } from '../handlers/update_kanji';
import { eq } from 'drizzle-orm';

// Test setup data
const testKanji = {
  character: '水',
  meaning: 'water',
  kun_reading: 'みず',
  on_reading: 'スイ',
  romaji: 'mizu',
  jlpt_level: 'N5' as const
};

const testKanji2 = {
  character: '火',
  meaning: 'fire',
  kun_reading: 'ひ',
  on_reading: 'カ',
  romaji: 'hi',
  jlpt_level: 'N5' as const
};

describe('updateKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an existing kanji', async () => {
    // Create initial kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Update all fields
    const updateInput: UpdateKanjiInput = {
      id: kanjiId,
      character: '木',
      meaning: 'tree, wood',
      kun_reading: 'き',
      on_reading: 'モク',
      romaji: 'ki',
      jlpt_level: 'N4'
    };

    const result = await updateKanji(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(kanjiId);
    expect(result!.character).toBe('木');
    expect(result!.meaning).toBe('tree, wood');
    expect(result!.kun_reading).toBe('き');
    expect(result!.on_reading).toBe('モク');
    expect(result!.romaji).toBe('ki');
    expect(result!.jlpt_level).toBe('N4');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields (partial update)', async () => {
    // Create initial kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Update only meaning and JLPT level
    const updateInput: UpdateKanjiInput = {
      id: kanjiId,
      meaning: 'H2O, water element',
      jlpt_level: 'N4'
    };

    const result = await updateKanji(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(kanjiId);
    expect(result!.character).toBe('水'); // Unchanged
    expect(result!.meaning).toBe('H2O, water element'); // Updated
    expect(result!.kun_reading).toBe('みず'); // Unchanged
    expect(result!.on_reading).toBe('スイ'); // Unchanged
    expect(result!.romaji).toBe('mizu'); // Unchanged
    expect(result!.jlpt_level).toBe('N4'); // Updated
  });

  it('should handle nullable fields correctly', async () => {
    // Create kanji with some null fields
    const kanjiWithNulls = {
      character: '心',
      meaning: 'heart, mind',
      kun_reading: null,
      on_reading: 'シン',
      romaji: null,
      jlpt_level: 'N3' as const
    };

    const created = await db.insert(kanjiTable)
      .values(kanjiWithNulls)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Update nullable fields
    const updateInput: UpdateKanjiInput = {
      id: kanjiId,
      kun_reading: 'こころ',
      romaji: 'kokoro'
    };

    const result = await updateKanji(updateInput);

    expect(result).not.toBeNull();
    expect(result!.kun_reading).toBe('こころ');
    expect(result!.romaji).toBe('kokoro');
    expect(result!.on_reading).toBe('シン'); // Unchanged
  });

  it('should set fields to null when explicitly provided', async () => {
    // Create kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Set nullable fields to null
    const updateInput: UpdateKanjiInput = {
      id: kanjiId,
      kun_reading: null,
      romaji: null
    };

    const result = await updateKanji(updateInput);

    expect(result).not.toBeNull();
    expect(result!.kun_reading).toBeNull();
    expect(result!.romaji).toBeNull();
    expect(result!.on_reading).toBe('スイ'); // Unchanged
  });

  it('should return null when kanji does not exist', async () => {
    const updateInput: UpdateKanjiInput = {
      id: 99999,
      meaning: 'non-existent'
    };

    const result = await updateKanji(updateInput);

    expect(result).toBeNull();
  });

  it('should return existing kanji when no fields to update', async () => {
    // Create kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Update with only ID (no other fields)
    const updateInput: UpdateKanjiInput = {
      id: kanjiId
    };

    const result = await updateKanji(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(kanjiId);
    expect(result!.character).toBe('水');
    expect(result!.meaning).toBe('water');
  });

  it('should save updated kanji to database', async () => {
    // Create kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Update kanji
    const updateInput: UpdateKanjiInput = {
      id: kanjiId,
      meaning: 'updated water meaning'
    };

    await updateKanji(updateInput);

    // Verify in database
    const saved = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, kanjiId))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].meaning).toBe('updated water meaning');
  });
});

describe('deleteKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing kanji', async () => {
    // Create kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Delete kanji
    const result = await deleteKanji(kanjiId);

    expect(result).toBe(true);

    // Verify deletion
    const remaining = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, kanjiId))
      .execute();

    expect(remaining).toHaveLength(0);
  });

  it('should return false when kanji does not exist', async () => {
    const result = await deleteKanji(99999);

    expect(result).toBe(false);
  });

  it('should cascade delete associated user progress records', async () => {
    // Create kanji
    const created = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanjiId = created[0].id;

    // Create user progress records
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'user1',
          kanji_id: kanjiId,
          correct_count: 5,
          incorrect_count: 2,
          current_interval: 7,
          ease_factor: 2.5,
          next_review_date: new Date()
        },
        {
          user_id: 'user2',
          kanji_id: kanjiId,
          correct_count: 3,
          incorrect_count: 1,
          current_interval: 3,
          ease_factor: 2.6,
          next_review_date: new Date()
        }
      ])
      .execute();

    // Verify progress records exist
    const progressBefore = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.kanji_id, kanjiId))
      .execute();

    expect(progressBefore).toHaveLength(2);

    // Delete kanji
    const result = await deleteKanji(kanjiId);

    expect(result).toBe(true);

    // Verify cascade deletion of progress records
    const progressAfter = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.kanji_id, kanjiId))
      .execute();

    expect(progressAfter).toHaveLength(0);
  });

  it('should not affect other kanji when deleting one', async () => {
    // Create two kanji
    const created1 = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const created2 = await db.insert(kanjiTable)
      .values(testKanji2)
      .returning()
      .execute();

    const kanjiId1 = created1[0].id;
    const kanjiId2 = created2[0].id;

    // Delete first kanji
    const result = await deleteKanji(kanjiId1);

    expect(result).toBe(true);

    // Verify first kanji is deleted
    const remaining1 = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, kanjiId1))
      .execute();

    expect(remaining1).toHaveLength(0);

    // Verify second kanji still exists
    const remaining2 = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, kanjiId2))
      .execute();

    expect(remaining2).toHaveLength(1);
    expect(remaining2[0].character).toBe('火');
  });
});
