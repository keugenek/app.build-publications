import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable, reviewSessionsTable } from '../db/schema';
import { type GetUserStatsQuery } from '../schema';
import { getUserStats } from '../handlers/get_user_stats';

// Test data setup
const testKanji = [
  {
    character: '水',
    meaning: 'water',
    kun_reading: 'みず',
    on_reading: 'スイ',
    jlpt_level: 'N5' as const,
    stroke_count: 4
  },
  {
    character: '火',
    meaning: 'fire',
    kun_reading: 'ひ',
    on_reading: 'カ',
    jlpt_level: 'N5' as const,
    stroke_count: 4
  },
  {
    character: '学',
    meaning: 'study',
    kun_reading: 'まな',
    on_reading: 'ガク',
    jlpt_level: 'N4' as const,
    stroke_count: 8
  }
];

describe('getUserStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats for user with no progress', async () => {
    const query: GetUserStatsQuery = {
      user_id: 'test_user'
    };

    const result = await getUserStats(query);

    expect(result.user_id).toBe('test_user');
    expect(result.total_kanji).toBe(0);
    expect(result.apprentice_count).toBe(0);
    expect(result.guru_count).toBe(0);
    expect(result.master_count).toBe(0);
    expect(result.enlightened_count).toBe(0);
    expect(result.burned_count).toBe(0);
    expect(result.reviews_due_count).toBe(0);
    expect(result.accuracy_percentage).toBe(0);
  });

  it('should calculate basic user statistics', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const now = new Date();
    const pastTime = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const futureTime = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

    // Create user progress with different SRS levels
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: pastTime, // Due for review
          correct_streak: 0,
          incorrect_count: 1,
          last_reviewed_at: pastTime
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[1].id,
          srs_level: 'GURU_1',
          next_review_at: futureTime, // Not due for review
          correct_streak: 2,
          incorrect_count: 0,
          last_reviewed_at: pastTime
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[2].id,
          srs_level: 'MASTER',
          next_review_at: pastTime, // Due for review
          correct_streak: 5,
          incorrect_count: 0,
          last_reviewed_at: pastTime
        }
      ])
      .execute();

    // Create review session data for accuracy calculation
    await db.insert(reviewSessionsTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id,
          result: 'INCORRECT',
          response_time_ms: 3000,
          previous_srs_level: 'APPRENTICE_1',
          new_srs_level: 'APPRENTICE_1'
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[1].id,
          result: 'CORRECT',
          response_time_ms: 2000,
          previous_srs_level: 'APPRENTICE_4',
          new_srs_level: 'GURU_1'
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[1].id,
          result: 'CORRECT',
          response_time_ms: 1500,
          previous_srs_level: 'GURU_1',
          new_srs_level: 'GURU_1'
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[2].id,
          result: 'CORRECT',
          response_time_ms: 1000,
          previous_srs_level: 'GURU_2',
          new_srs_level: 'MASTER'
        }
      ])
      .execute();

    const query: GetUserStatsQuery = {
      user_id: 'test_user'
    };

    const result = await getUserStats(query);

    expect(result.user_id).toBe('test_user');
    expect(result.total_kanji).toBe(3);
    expect(result.apprentice_count).toBe(1);
    expect(result.guru_count).toBe(1);
    expect(result.master_count).toBe(1);
    expect(result.enlightened_count).toBe(0);
    expect(result.burned_count).toBe(0);
    expect(result.reviews_due_count).toBe(2); // APPRENTICE_1 and MASTER are due
    expect(result.accuracy_percentage).toBe(75); // 3 correct out of 4 total = 75%
  });

  it('should filter statistics by JLPT level', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const now = new Date();
    const pastTime = new Date(now.getTime() - 1000 * 60 * 60);

    // Create user progress for all kanji
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id, // N5 kanji
          srs_level: 'APPRENTICE_2',
          next_review_at: pastTime,
          correct_streak: 1,
          incorrect_count: 0
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[1].id, // N5 kanji
          srs_level: 'GURU_1',
          next_review_at: pastTime,
          correct_streak: 3,
          incorrect_count: 1
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[2].id, // N4 kanji
          srs_level: 'MASTER',
          next_review_at: pastTime,
          correct_streak: 5,
          incorrect_count: 0
        }
      ])
      .execute();

    // Create review sessions for N5 kanji only
    await db.insert(reviewSessionsTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id, // N5
          result: 'CORRECT',
          response_time_ms: 2000,
          previous_srs_level: 'APPRENTICE_1',
          new_srs_level: 'APPRENTICE_2'
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[1].id, // N5
          result: 'INCORRECT',
          response_time_ms: 3000,
          previous_srs_level: 'GURU_1',
          new_srs_level: 'GURU_1'
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[2].id, // N4
          result: 'CORRECT',
          response_time_ms: 1500,
          previous_srs_level: 'GURU_2',
          new_srs_level: 'MASTER'
        }
      ])
      .execute();

    const query: GetUserStatsQuery = {
      user_id: 'test_user',
      jlpt_level: 'N5'
    };

    const result = await getUserStats(query);

    expect(result.user_id).toBe('test_user');
    expect(result.total_kanji).toBe(2); // Only N5 kanji
    expect(result.apprentice_count).toBe(1); // One APPRENTICE_2
    expect(result.guru_count).toBe(1); // One GURU_1
    expect(result.master_count).toBe(0); // N4 kanji excluded
    expect(result.enlightened_count).toBe(0);
    expect(result.burned_count).toBe(0);
    expect(result.reviews_due_count).toBe(2); // Both N5 kanji are due
    expect(result.accuracy_percentage).toBe(50); // 1 correct out of 2 N5 reviews = 50%
  });

  it('should handle multiple apprentice and guru levels correctly', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([
        testKanji[0], // Will be APPRENTICE_1
        testKanji[1], // Will be APPRENTICE_4
        testKanji[2]  // Will be GURU_2
      ])
      .returning()
      .execute();

    const futureTime = new Date(Date.now() + 1000 * 60 * 60);

    // Create user progress with different apprentice and guru levels
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: futureTime,
          correct_streak: 0,
          incorrect_count: 0
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[1].id,
          srs_level: 'APPRENTICE_4',
          next_review_at: futureTime,
          correct_streak: 3,
          incorrect_count: 0
        },
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[2].id,
          srs_level: 'GURU_2',
          next_review_at: futureTime,
          correct_streak: 5,
          incorrect_count: 0
        }
      ])
      .execute();

    const query: GetUserStatsQuery = {
      user_id: 'test_user'
    };

    const result = await getUserStats(query);

    expect(result.total_kanji).toBe(3);
    expect(result.apprentice_count).toBe(2); // APPRENTICE_1 and APPRENTICE_4
    expect(result.guru_count).toBe(1); // GURU_2
    expect(result.master_count).toBe(0);
    expect(result.enlightened_count).toBe(0);
    expect(result.burned_count).toBe(0);
    expect(result.reviews_due_count).toBe(0); // All are in future
  });

  it('should handle burned kanji correctly (no reviews due)', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji[0]])
      .returning()
      .execute();

    const pastTime = new Date(Date.now() - 1000 * 60 * 60);

    // Create burned kanji progress
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id,
          srs_level: 'BURNED',
          next_review_at: pastTime, // Even though it's in the past, BURNED items don't need review
          correct_streak: 10,
          incorrect_count: 0
        }
      ])
      .execute();

    const query: GetUserStatsQuery = {
      user_id: 'test_user'
    };

    const result = await getUserStats(query);

    expect(result.total_kanji).toBe(1);
    expect(result.burned_count).toBe(1);
    expect(result.reviews_due_count).toBe(0); // BURNED items are never due for review
  });

  it('should handle user with no review sessions (zero accuracy)', async () => {
    // Create test kanji and progress but no review sessions
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji[0]])
      .returning()
      .execute();

    const futureTime = new Date(Date.now() + 1000 * 60 * 60);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test_user',
          kanji_id: kanjiResults[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: futureTime,
          correct_streak: 0,
          incorrect_count: 0
        }
      ])
      .execute();

    const query: GetUserStatsQuery = {
      user_id: 'test_user'
    };

    const result = await getUserStats(query);

    expect(result.total_kanji).toBe(1);
    expect(result.apprentice_count).toBe(1);
    expect(result.accuracy_percentage).toBe(0); // No review sessions = 0% accuracy
  });
});
