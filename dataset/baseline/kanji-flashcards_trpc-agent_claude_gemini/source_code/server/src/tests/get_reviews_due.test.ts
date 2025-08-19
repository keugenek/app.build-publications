import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetReviewsDueQuery, type Kanji } from '../schema';
import { getReviewsDue } from '../handlers/get_reviews_due';

// Test input
const testQuery: GetReviewsDueQuery = {
  user_id: 'test-user',
  limit: 10
};

describe('getReviewsDue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return kanji due for review', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([
        {
          character: '水',
          meaning: 'water',
          kun_reading: 'みず',
          on_reading: 'スイ',
          jlpt_level: 'N5',
          stroke_count: 4
        },
        {
          character: '火',
          meaning: 'fire',
          kun_reading: 'ひ',
          on_reading: 'カ',
          jlpt_level: 'N5',
          stroke_count: 4
        }
      ])
      .returning()
      .execute();

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1); // 1 hour ago

    // Create user progress with reviews due
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test-user',
          kanji_id: kanjiResults[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: pastTime,
          correct_streak: 0,
          incorrect_count: 0
        },
        {
          user_id: 'test-user',
          kanji_id: kanjiResults[1].id,
          srs_level: 'GURU_1',
          next_review_at: pastTime,
          correct_streak: 3,
          incorrect_count: 1
        }
      ])
      .execute();

    const result = await getReviewsDue(testQuery);

    expect(result).toHaveLength(2);
    
    // Verify kanji structure
    result.forEach(kanji => {
      expect(kanji.id).toBeDefined();
      expect(kanji.character).toBeDefined();
      expect(kanji.meaning).toBeDefined();
      expect(kanji.jlpt_level).toBeDefined();
      expect(kanji.stroke_count).toBeDefined();
      expect(kanji.created_at).toBeInstanceOf(Date);
    });

    // Check specific kanji content
    const waterKanji = result.find(k => k.character === '水');
    expect(waterKanji).toBeDefined();
    expect(waterKanji?.meaning).toBe('water');
    expect(waterKanji?.kun_reading).toBe('みず');
    expect(waterKanji?.on_reading).toBe('スイ');
  });

  it('should not return kanji not due for review', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '木',
        meaning: 'tree',
        kun_reading: 'き',
        on_reading: 'モク',
        jlpt_level: 'N5',
        stroke_count: 4
      })
      .returning()
      .execute();

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2); // 2 hours in the future

    // Create user progress with review in the future
    await db.insert(userProgressTable)
      .values({
        user_id: 'test-user',
        kanji_id: kanjiResult[0].id,
        srs_level: 'APPRENTICE_2',
        next_review_at: futureTime,
        correct_streak: 1,
        incorrect_count: 0
      })
      .execute();

    const result = await getReviewsDue(testQuery);

    expect(result).toHaveLength(0);
  });

  it('should not return burned kanji', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '金',
        meaning: 'gold',
        kun_reading: 'きん',
        on_reading: 'キン',
        jlpt_level: 'N5',
        stroke_count: 8
      })
      .returning()
      .execute();

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    // Create burned user progress (should not be returned)
    await db.insert(userProgressTable)
      .values({
        user_id: 'test-user',
        kanji_id: kanjiResult[0].id,
        srs_level: 'BURNED',
        next_review_at: pastTime,
        correct_streak: 8,
        incorrect_count: 0
      })
      .execute();

    const result = await getReviewsDue(testQuery);

    expect(result).toHaveLength(0);
  });

  it('should only return kanji for the specified user', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '土',
        meaning: 'earth',
        kun_reading: 'つち',
        on_reading: 'ド',
        jlpt_level: 'N5',
        stroke_count: 3
      })
      .returning()
      .execute();

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    // Create user progress for different users
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test-user',
          kanji_id: kanjiResult[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: pastTime,
          correct_streak: 0,
          incorrect_count: 0
        },
        {
          user_id: 'other-user',
          kanji_id: kanjiResult[0].id,
          srs_level: 'APPRENTICE_1',
          next_review_at: pastTime,
          correct_streak: 0,
          incorrect_count: 0
        }
      ])
      .execute();

    const result = await getReviewsDue(testQuery);

    expect(result).toHaveLength(1);
    expect(result[0].character).toBe('土');
  });

  it('should respect the limit parameter', async () => {
    // Create multiple test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([
        { character: '一', meaning: 'one', kun_reading: 'ひと', on_reading: 'イチ', jlpt_level: 'N5', stroke_count: 1 },
        { character: '二', meaning: 'two', kun_reading: 'ふた', on_reading: 'ニ', jlpt_level: 'N5', stroke_count: 2 },
        { character: '三', meaning: 'three', kun_reading: 'みっ', on_reading: 'サン', jlpt_level: 'N5', stroke_count: 3 },
        { character: '四', meaning: 'four', kun_reading: 'よん', on_reading: 'シ', jlpt_level: 'N5', stroke_count: 5 },
        { character: '五', meaning: 'five', kun_reading: 'いつ', on_reading: 'ゴ', jlpt_level: 'N5', stroke_count: 4 }
      ])
      .returning()
      .execute();

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    // Create user progress for all kanji
    const progressData = kanjiResults.map(kanji => ({
      user_id: 'test-user',
      kanji_id: kanji.id,
      srs_level: 'APPRENTICE_1' as const,
      next_review_at: pastTime,
      correct_streak: 0,
      incorrect_count: 0
    }));

    await db.insert(userProgressTable)
      .values(progressData)
      .execute();

    // Test with limit of 3
    const limitedQuery: GetReviewsDueQuery = {
      user_id: 'test-user',
      limit: 3
    };

    const result = await getReviewsDue(limitedQuery);

    expect(result).toHaveLength(3);
  });

  it('should order by next_review_at (oldest first)', async () => {
    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([
        { character: '早', meaning: 'early', kun_reading: 'はや', on_reading: 'ソウ', jlpt_level: 'N4', stroke_count: 6 },
        { character: '遅', meaning: 'late', kun_reading: 'おそ', on_reading: 'チ', jlpt_level: 'N3', stroke_count: 12 }
      ])
      .returning()
      .execute();

    const olderTime = new Date();
    olderTime.setHours(olderTime.getHours() - 2); // 2 hours ago

    const newerTime = new Date();
    newerTime.setHours(newerTime.getHours() - 1); // 1 hour ago

    // Create user progress with different review times
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'test-user',
          kanji_id: kanjiResults[0].id, // 早 - newer time
          srs_level: 'APPRENTICE_1',
          next_review_at: newerTime,
          correct_streak: 0,
          incorrect_count: 0
        },
        {
          user_id: 'test-user',
          kanji_id: kanjiResults[1].id, // 遅 - older time
          srs_level: 'APPRENTICE_1',
          next_review_at: olderTime,
          correct_streak: 0,
          incorrect_count: 0
        }
      ])
      .execute();

    const result = await getReviewsDue(testQuery);

    expect(result).toHaveLength(2);
    // First should be the one with older review time (遅)
    expect(result[0].character).toBe('遅');
    // Second should be the one with newer review time (早)
    expect(result[1].character).toBe('早');
  });

  it('should return empty array when no reviews are due', async () => {
    // Create test kanji but no user progress
    await db.insert(kanjiTable)
      .values({
        character: '休',
        meaning: 'rest',
        kun_reading: 'やす',
        on_reading: 'キュウ',
        jlpt_level: 'N5',
        stroke_count: 6
      })
      .execute();

    const result = await getReviewsDue(testQuery);

    expect(result).toHaveLength(0);
  });

  it('should handle user with no progress', async () => {
    const emptyUserQuery: GetReviewsDueQuery = {
      user_id: 'nonexistent-user',
      limit: 10
    };

    const result = await getReviewsDue(emptyUserQuery);

    expect(result).toHaveLength(0);
  });
});
