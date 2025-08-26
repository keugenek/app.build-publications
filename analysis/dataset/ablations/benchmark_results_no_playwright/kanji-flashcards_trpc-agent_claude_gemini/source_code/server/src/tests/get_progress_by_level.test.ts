import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjiTable, userProgressTable } from '../db/schema';
import { type GetProgressByLevelInput } from '../schema';
import { getProgressByLevel } from '../handlers/get_progress_by_level';

describe('getProgressByLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let testUserId: number;

  const setupTestData = async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test kanji for different levels
    const kanjiInserts = await db.insert(kanjiTable)
      .values([
        // N5 kanji (3 total)
        {
          character: '人',
          meaning_english: 'person',
          reading_hiragana: 'ひと',
          reading_katakana: null,
          jlpt_level: 'N5'
        },
        {
          character: '本',
          meaning_english: 'book',
          reading_hiragana: 'ほん',
          reading_katakana: null,
          jlpt_level: 'N5'
        },
        {
          character: '水',
          meaning_english: 'water',
          reading_hiragana: 'みず',
          reading_katakana: null,
          jlpt_level: 'N5'
        },
        // N4 kanji (2 total)
        {
          character: '家',
          meaning_english: 'house',
          reading_hiragana: 'いえ',
          reading_katakana: null,
          jlpt_level: 'N4'
        },
        {
          character: '学',
          meaning_english: 'study',
          reading_hiragana: 'がく',
          reading_katakana: null,
          jlpt_level: 'N4'
        },
        // N3 kanji (1 total)
        {
          character: '経',
          meaning_english: 'experience',
          reading_hiragana: 'けい',
          reading_katakana: null,
          jlpt_level: 'N3'
        }
      ])
      .returning()
      .execute();

    // Create progress records for some kanji
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(userProgressTable)
      .values([
        // N5 progress: 2 learned (1 due, 1 not due)
        {
          user_id: testUserId,
          kanji_id: kanjiInserts[0].id, // 人 - due for review
          srs_level: 'APPRENTICE_2',
          next_review_at: yesterday,
          correct_streak: 1,
          total_reviews: 2
        },
        {
          user_id: testUserId,
          kanji_id: kanjiInserts[1].id, // 本 - not due yet
          srs_level: 'GURU_1',
          next_review_at: tomorrow,
          correct_streak: 3,
          total_reviews: 4
        },
        // N4 progress: 1 learned (1 due)
        {
          user_id: testUserId,
          kanji_id: kanjiInserts[3].id, // 家 - due for review
          srs_level: 'APPRENTICE_1',
          next_review_at: yesterday,
          correct_streak: 0,
          total_reviews: 1
        }
        // N3: no progress (0 learned)
      ])
      .execute();
  };

  it('should get progress stats for a specific JLPT level', async () => {
    await setupTestData();

    const input: GetProgressByLevelInput = {
      user_id: testUserId,
      jlpt_level: 'N5'
    };

    const result = await getProgressByLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].jlpt_level).toEqual('N5');
    expect(result[0].total_kanji).toEqual(3);
    expect(result[0].learned_kanji).toEqual(2);
    expect(result[0].due_for_review).toEqual(1);
    expect(result[0].completion_percentage).toEqual(66.67); // (2/3) * 100
  });

  it('should get progress stats for all JLPT levels when level not specified', async () => {
    await setupTestData();

    const input: GetProgressByLevelInput = {
      user_id: testUserId
    };

    const result = await getProgressByLevel(input);

    expect(result).toHaveLength(5);
    
    // Check N5 stats
    const n5Stats = result.find(r => r.jlpt_level === 'N5');
    expect(n5Stats).toBeDefined();
    expect(n5Stats!.total_kanji).toEqual(3);
    expect(n5Stats!.learned_kanji).toEqual(2);
    expect(n5Stats!.due_for_review).toEqual(1);
    expect(n5Stats!.completion_percentage).toEqual(66.67);

    // Check N4 stats
    const n4Stats = result.find(r => r.jlpt_level === 'N4');
    expect(n4Stats).toBeDefined();
    expect(n4Stats!.total_kanji).toEqual(2);
    expect(n4Stats!.learned_kanji).toEqual(1);
    expect(n4Stats!.due_for_review).toEqual(1);
    expect(n4Stats!.completion_percentage).toEqual(50.0);

    // Check N3 stats (no progress)
    const n3Stats = result.find(r => r.jlpt_level === 'N3');
    expect(n3Stats).toBeDefined();
    expect(n3Stats!.total_kanji).toEqual(1);
    expect(n3Stats!.learned_kanji).toEqual(0);
    expect(n3Stats!.due_for_review).toEqual(0);
    expect(n3Stats!.completion_percentage).toEqual(0);

    // Check N2 and N1 stats (no kanji)
    const n2Stats = result.find(r => r.jlpt_level === 'N2');
    expect(n2Stats).toBeDefined();
    expect(n2Stats!.total_kanji).toEqual(0);
    expect(n2Stats!.learned_kanji).toEqual(0);
    expect(n2Stats!.due_for_review).toEqual(0);
    expect(n2Stats!.completion_percentage).toEqual(0);

    const n1Stats = result.find(r => r.jlpt_level === 'N1');
    expect(n1Stats).toBeDefined();
    expect(n1Stats!.total_kanji).toEqual(0);
    expect(n1Stats!.learned_kanji).toEqual(0);
    expect(n1Stats!.due_for_review).toEqual(0);
    expect(n1Stats!.completion_percentage).toEqual(0);
  });

  it('should return zero stats for user with no progress', async () => {
    // Create user without progress
    const userResult = await db.insert(usersTable)
      .values({
        email: 'noprogress@example.com',
        username: 'noprogress',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create some kanji but no progress
    await db.insert(kanjiTable)
      .values([
        {
          character: '日',
          meaning_english: 'day',
          reading_hiragana: 'ひ',
          reading_katakana: null,
          jlpt_level: 'N5'
        }
      ])
      .execute();

    const input: GetProgressByLevelInput = {
      user_id: userResult[0].id,
      jlpt_level: 'N5'
    };

    const result = await getProgressByLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].jlpt_level).toEqual('N5');
    expect(result[0].total_kanji).toEqual(1);
    expect(result[0].learned_kanji).toEqual(0);
    expect(result[0].due_for_review).toEqual(0);
    expect(result[0].completion_percentage).toEqual(0);
  });

  it('should handle level with no kanji', async () => {
    await setupTestData();

    const input: GetProgressByLevelInput = {
      user_id: testUserId,
      jlpt_level: 'N1' // No N1 kanji in test data
    };

    const result = await getProgressByLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].jlpt_level).toEqual('N1');
    expect(result[0].total_kanji).toEqual(0);
    expect(result[0].learned_kanji).toEqual(0);
    expect(result[0].due_for_review).toEqual(0);
    expect(result[0].completion_percentage).toEqual(0);
  });

  it('should correctly identify due reviews based on next_review_at', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'timetest@example.com',
        username: 'timetest',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values([
        {
          character: '時',
          meaning_english: 'time',
          reading_hiragana: 'じ',
          reading_katakana: null,
          jlpt_level: 'N4'
        },
        {
          character: '間',
          meaning_english: 'interval',
          reading_hiragana: 'あいだ',
          reading_katakana: null,
          jlpt_level: 'N4'
        }
      ])
      .returning()
      .execute();

    // Create progress with different review times
    const now = new Date();
    const pastTime = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const futureTime = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

    await db.insert(userProgressTable)
      .values([
        {
          user_id: userResult[0].id,
          kanji_id: kanjiResult[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: pastTime, // Due for review
          correct_streak: 0,
          total_reviews: 1
        },
        {
          user_id: userResult[0].id,
          kanji_id: kanjiResult[1].id,
          srs_level: 'GURU_1',
          next_review_at: futureTime, // Not due yet
          correct_streak: 2,
          total_reviews: 3
        }
      ])
      .execute();

    const input: GetProgressByLevelInput = {
      user_id: userResult[0].id,
      jlpt_level: 'N4'
    };

    const result = await getProgressByLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_kanji).toEqual(2);
    expect(result[0].learned_kanji).toEqual(2);
    expect(result[0].due_for_review).toEqual(1); // Only the one with past review time
    expect(result[0].completion_percentage).toEqual(100);
  });

  it('should isolate progress by user_id', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        username: 'user1',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        username: 'user2',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values([
        {
          character: '分',
          meaning_english: 'minute',
          reading_hiragana: 'ふん',
          reading_katakana: null,
          jlpt_level: 'N5'
        }
      ])
      .returning()
      .execute();

    // Create progress for both users
    await db.insert(userProgressTable)
      .values([
        {
          user_id: user1Result[0].id,
          kanji_id: kanjiResult[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: new Date(),
          correct_streak: 0,
          total_reviews: 1
        },
        {
          user_id: user2Result[0].id,
          kanji_id: kanjiResult[0].id,
          srs_level: 'GURU_1',
          next_review_at: new Date(),
          correct_streak: 2,
          total_reviews: 3
        }
      ])
      .execute();

    // Test that each user only sees their own progress
    const user1Input: GetProgressByLevelInput = {
      user_id: user1Result[0].id,
      jlpt_level: 'N5'
    };

    const user1Result_stats = await getProgressByLevel(user1Input);
    expect(user1Result_stats[0].learned_kanji).toEqual(1);

    const user2Input: GetProgressByLevelInput = {
      user_id: user2Result[0].id,
      jlpt_level: 'N5'
    };

    const user2Result_stats = await getProgressByLevel(user2Input);
    expect(user2Result_stats[0].learned_kanji).toEqual(1);

    // Test with non-existent user
    const nonExistentUserInput: GetProgressByLevelInput = {
      user_id: 99999,
      jlpt_level: 'N5'
    };

    const nonExistentResult = await getProgressByLevel(nonExistentUserInput);
    expect(nonExistentResult[0].learned_kanji).toEqual(0);
    expect(nonExistentResult[0].due_for_review).toEqual(0);
  });
});
