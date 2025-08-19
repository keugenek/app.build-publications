import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { getUserProgress } from '../handlers/get_user_progress';

// Test data
const testKanji1: CreateKanjiInput = {
  character: '水',
  meaning: 'water',
  kun_reading: 'みず',
  on_reading: 'スイ',
  jlpt_level: 'N5',
  stroke_count: 4
};

const testKanji2: CreateKanjiInput = {
  character: '火',
  meaning: 'fire',
  kun_reading: 'ひ',
  on_reading: 'カ',
  jlpt_level: 'N5',
  stroke_count: 4
};

const testKanji3: CreateKanjiInput = {
  character: '愛',
  meaning: 'love',
  kun_reading: 'あい',
  on_reading: 'アイ',
  jlpt_level: 'N3',
  stroke_count: 13
};

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no progress', async () => {
    const result = await getUserProgress('user1');

    expect(result).toEqual([]);
  });

  it('should return user progress records for specific user', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1, testKanji2])
      .returning()
      .execute();

    const kanji1Id = kanjiResults[0].id;
    const kanji2Id = kanjiResults[1].id;

    // Create user progress records
    const nextReviewDate = new Date();
    nextReviewDate.setHours(nextReviewDate.getHours() + 4);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'user1',
          kanji_id: kanji1Id,
          srs_level: 'APPRENTICE_1',
          next_review_at: nextReviewDate,
          correct_streak: 2,
          incorrect_count: 1,
          last_reviewed_at: new Date()
        },
        {
          user_id: 'user1',
          kanji_id: kanji2Id,
          srs_level: 'GURU_1',
          next_review_at: nextReviewDate,
          correct_streak: 5,
          incorrect_count: 0,
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserProgress('user1');

    expect(result).toHaveLength(2);
    
    // Check first progress record
    const progress1 = result.find(p => p.kanji_id === kanji1Id);
    expect(progress1).toBeDefined();
    expect(progress1!.user_id).toBe('user1');
    expect(progress1!.srs_level).toBe('APPRENTICE_1');
    expect(progress1!.correct_streak).toBe(2);
    expect(progress1!.incorrect_count).toBe(1);
    expect(progress1!.next_review_at).toBeInstanceOf(Date);
    expect(progress1!.last_reviewed_at).toBeInstanceOf(Date);
    expect(progress1!.created_at).toBeInstanceOf(Date);
    expect(progress1!.updated_at).toBeInstanceOf(Date);
    expect(progress1!.id).toBeDefined();

    // Check second progress record
    const progress2 = result.find(p => p.kanji_id === kanji2Id);
    expect(progress2).toBeDefined();
    expect(progress2!.user_id).toBe('user1');
    expect(progress2!.srs_level).toBe('GURU_1');
    expect(progress2!.correct_streak).toBe(5);
    expect(progress2!.incorrect_count).toBe(0);
  });

  it('should only return progress for specified user', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values(testKanji1)
      .returning()
      .execute();

    const kanjiId = kanjiResult[0].id;

    // Create progress records for different users
    const nextReviewDate = new Date();
    nextReviewDate.setHours(nextReviewDate.getHours() + 4);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'user1',
          kanji_id: kanjiId,
          srs_level: 'APPRENTICE_1',
          next_review_at: nextReviewDate,
          correct_streak: 1,
          incorrect_count: 0,
          last_reviewed_at: new Date()
        },
        {
          user_id: 'user2',
          kanji_id: kanjiId,
          srs_level: 'GURU_1',
          next_review_at: nextReviewDate,
          correct_streak: 3,
          incorrect_count: 0,
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserProgress('user1');

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('user1');
    expect(result[0].srs_level).toBe('APPRENTICE_1');
    expect(result[0].correct_streak).toBe(1);
  });

  it('should filter by JLPT level when specified', async () => {
    // Create test kanji with different JLPT levels
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1, testKanji3]) // N5 and N3 kanji
      .returning()
      .execute();

    const n5KanjiId = kanjiResults[0].id;
    const n3KanjiId = kanjiResults[1].id;

    // Create progress records for both kanji
    const nextReviewDate = new Date();
    nextReviewDate.setHours(nextReviewDate.getHours() + 4);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'user1',
          kanji_id: n5KanjiId,
          srs_level: 'APPRENTICE_1',
          next_review_at: nextReviewDate,
          correct_streak: 1,
          incorrect_count: 0,
          last_reviewed_at: new Date()
        },
        {
          user_id: 'user1',
          kanji_id: n3KanjiId,
          srs_level: 'GURU_1',
          next_review_at: nextReviewDate,
          correct_streak: 3,
          incorrect_count: 0,
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    // Test filtering by N5 level
    const n5Results = await getUserProgress('user1', 'N5');
    expect(n5Results).toHaveLength(1);
    expect(n5Results[0].kanji_id).toBe(n5KanjiId);
    expect(n5Results[0].srs_level).toBe('APPRENTICE_1');

    // Test filtering by N3 level
    const n3Results = await getUserProgress('user1', 'N3');
    expect(n3Results).toHaveLength(1);
    expect(n3Results[0].kanji_id).toBe(n3KanjiId);
    expect(n3Results[0].srs_level).toBe('GURU_1');

    // Test filtering by N1 level (should return empty)
    const n1Results = await getUserProgress('user1', 'N1');
    expect(n1Results).toHaveLength(0);
  });

  it('should return progress records ordered by creation date', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1, testKanji2])
      .returning()
      .execute();

    const kanji1Id = kanjiResults[0].id;
    const kanji2Id = kanjiResults[1].id;

    // Create progress records with different creation times
    const baseDate = new Date();
    const firstDate = new Date(baseDate.getTime() - 1000); // 1 second earlier
    const secondDate = new Date(baseDate.getTime());

    const nextReviewDate = new Date();
    nextReviewDate.setHours(nextReviewDate.getHours() + 4);

    // Insert second record first, then first record
    // This tests that ordering is by created_at, not insertion order
    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanji2Id,
        srs_level: 'GURU_1',
        next_review_at: nextReviewDate,
        correct_streak: 3,
        incorrect_count: 0,
        last_reviewed_at: secondDate,
        created_at: secondDate,
        updated_at: secondDate
      })
      .execute();

    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanji1Id,
        srs_level: 'APPRENTICE_1',
        next_review_at: nextReviewDate,
        correct_streak: 1,
        incorrect_count: 0,
        last_reviewed_at: firstDate,
        created_at: firstDate,
        updated_at: firstDate
      })
      .execute();

    const result = await getUserProgress('user1');

    expect(result).toHaveLength(2);
    // First result should be the one created earlier
    expect(result[0].kanji_id).toBe(kanji1Id);
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
    expect(result[1].kanji_id).toBe(kanji2Id);
  });

  it('should handle user progress with null last_reviewed_at', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values(testKanji1)
      .returning()
      .execute();

    const kanjiId = kanjiResult[0].id;

    // Create progress record with null last_reviewed_at (new kanji)
    const nextReviewDate = new Date();
    nextReviewDate.setHours(nextReviewDate.getHours() + 4);

    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanjiId,
        srs_level: 'APPRENTICE_1',
        next_review_at: nextReviewDate,
        correct_streak: 0,
        incorrect_count: 0,
        last_reviewed_at: null // Never reviewed yet
      })
      .execute();

    const result = await getUserProgress('user1');

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('user1');
    expect(result[0].kanji_id).toBe(kanjiId);
    expect(result[0].last_reviewed_at).toBeNull();
    expect(result[0].correct_streak).toBe(0);
    expect(result[0].incorrect_count).toBe(0);
    expect(result[0].srs_level).toBe('APPRENTICE_1');
  });
});
