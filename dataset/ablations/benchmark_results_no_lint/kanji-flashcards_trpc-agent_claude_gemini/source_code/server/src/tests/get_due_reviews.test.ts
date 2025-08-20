import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetDueReviewsInput } from '../schema';
import { getDueReviews, getUserProgress } from '../handlers/get_due_reviews';
import { eq } from 'drizzle-orm';

// Test data setup
const testUserId = 'test-user-123';
const testKanji = [
  {
    character: '山',
    meaning: 'mountain',
    kun_reading: 'やま',
    on_reading: 'サン',
    romaji: 'yama',
    jlpt_level: 'N5' as const
  },
  {
    character: '川',
    meaning: 'river',
    kun_reading: 'かわ',
    on_reading: 'セン',
    romaji: 'kawa',
    jlpt_level: 'N5' as const
  },
  {
    character: '日',
    meaning: 'day, sun',
    kun_reading: 'ひ',
    on_reading: 'ニチ',
    romaji: 'hi',
    jlpt_level: 'N4' as const
  }
];

const testInputBase: GetDueReviewsInput = {
  user_id: testUserId,
  limit: 20
};

describe('getDueReviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return new kanji with null progress', async () => {
    // Create kanji without any progress records
    const insertedKanji = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const result = await getDueReviews(testInputBase);

    expect(result).toHaveLength(3);
    
    const firstKanji = result[0];
    expect(firstKanji.character).toBeDefined();
    expect(firstKanji.meaning).toBeDefined();
    expect(firstKanji.jlpt_level).toBeDefined();
    expect(firstKanji.progress).toBeNull();
    expect(firstKanji.created_at).toBeInstanceOf(Date);

    // Verify all kanji are returned as new
    result.forEach(kanji => {
      expect(kanji.progress).toBeNull();
    });
  });

  it('should return kanji due for review based on next_review_date', async () => {
    // Create kanji
    const insertedKanji = await db.insert(kanjiTable)
      .values(testKanji.slice(0, 2)) // Only first 2 kanji
      .returning()
      .execute();

    // Create progress records - one due, one not due
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: testUserId,
          kanji_id: insertedKanji[0].id,
          correct_count: 2,
          incorrect_count: 1,
          current_interval: 3,
          ease_factor: 2.5,
          next_review_date: yesterday, // Due for review
          last_reviewed_at: new Date()
        },
        {
          user_id: testUserId,
          kanji_id: insertedKanji[1].id,
          correct_count: 1,
          incorrect_count: 0,
          current_interval: 5,
          ease_factor: 2.6,
          next_review_date: tomorrow, // Not due yet
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    const result = await getDueReviews(testInputBase);

    expect(result).toHaveLength(1);
    expect(result[0].character).toEqual('山');
    expect(result[0].progress).not.toBeNull();
    expect(result[0].progress!.correct_count).toEqual(2);
    expect(result[0].progress!.incorrect_count).toEqual(1);
    expect(result[0].progress!.ease_factor).toEqual(2.5);
    expect(typeof result[0].progress!.ease_factor).toBe('number');
  });

  it('should filter by JLPT level when specified', async () => {
    // Create kanji with different JLPT levels
    await db.insert(kanjiTable)
      .values(testKanji) // N5, N5, N4
      .returning()
      .execute();

    // Test filtering for N5 only
    const inputWithFilter: GetDueReviewsInput = {
      ...testInputBase,
      jlpt_level: 'N5'
    };

    const result = await getDueReviews(inputWithFilter);

    expect(result).toHaveLength(2);
    result.forEach(kanji => {
      expect(kanji.jlpt_level).toEqual('N5');
    });
  });

  it('should respect the limit parameter', async () => {
    // Create 5 kanji
    const manyKanji = Array.from({ length: 5 }, (_, i) => ({
      character: `漢${i}`,
      meaning: `meaning ${i}`,
      kun_reading: 'test',
      on_reading: 'TEST',
      romaji: 'test',
      jlpt_level: 'N5' as const
    }));

    await db.insert(kanjiTable)
      .values(manyKanji)
      .execute();

    const inputWithLimit: GetDueReviewsInput = {
      ...testInputBase,
      limit: 3
    };

    const result = await getDueReviews(inputWithLimit);

    expect(result).toHaveLength(3);
  });

  it('should handle mixed new kanji and due reviews', async () => {
    // Create kanji
    const insertedKanji = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    // Create progress for only some kanji
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: testUserId,
          kanji_id: insertedKanji[0].id,
          correct_count: 1,
          incorrect_count: 0,
          current_interval: 2,
          ease_factor: 2.5,
          next_review_date: yesterday, // Due for review
          last_reviewed_at: new Date()
        }
        // Leave other kanji without progress (new)
      ])
      .execute();

    const result = await getDueReviews(testInputBase);

    expect(result).toHaveLength(3);
    
    // One with progress (due for review)
    const kanjiWithProgress = result.find(k => k.progress !== null);
    expect(kanjiWithProgress).toBeDefined();
    expect(kanjiWithProgress!.character).toEqual('山');
    expect(kanjiWithProgress!.progress!.correct_count).toEqual(1);

    // Two without progress (new kanji)
    const newKanji = result.filter(k => k.progress === null);
    expect(newKanji).toHaveLength(2);
  });

  it('should not return kanji for different users', async () => {
    // Create kanji
    const insertedKanji = await db.insert(kanjiTable)
      .values([testKanji[0]])
      .returning()
      .execute();

    // Create progress for different user
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'different-user',
          kanji_id: insertedKanji[0].id,
          correct_count: 1,
          incorrect_count: 0,
          current_interval: 2,
          ease_factor: 2.5,
          next_review_date: yesterday,
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    const result = await getDueReviews(testInputBase);

    // Should return the kanji as new (no progress) for our test user
    expect(result).toHaveLength(1);
    expect(result[0].progress).toBeNull();
  });
});

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all kanji with user progress', async () => {
    // Create kanji
    const insertedKanji = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    // Create progress for all kanji
    const progressData = insertedKanji.map((kanji, index) => ({
      user_id: testUserId,
      kanji_id: kanji.id,
      correct_count: index + 1,
      incorrect_count: index,
      current_interval: (index + 1) * 2,
      ease_factor: 2.5 + (index * 0.1),
      next_review_date: new Date(),
      last_reviewed_at: new Date()
    }));

    await db.insert(userProgressTable)
      .values(progressData)
      .execute();

    const result = await getUserProgress(testUserId);

    expect(result).toHaveLength(3);
    
    result.forEach((kanji, index) => {
      expect(kanji.progress).not.toBeNull();
      expect(kanji.progress!.correct_count).toEqual(index + 1);
      expect(kanji.progress!.incorrect_count).toEqual(index);
      expect(kanji.progress!.current_interval).toEqual((index + 1) * 2);
      expect(typeof kanji.progress!.ease_factor).toBe('number');
      expect(kanji.progress!.ease_factor).toBeCloseTo(2.5 + (index * 0.1), 1);
      expect(kanji.created_at).toBeInstanceOf(Date);
      expect(kanji.progress!.created_at).toBeInstanceOf(Date);
    });
  });

  it('should only return kanji with progress for the specified user', async () => {
    // Create kanji
    const insertedKanji = await db.insert(kanjiTable)
      .values(testKanji.slice(0, 2))
      .returning()
      .execute();

    // Create progress for test user and another user
    await db.insert(userProgressTable)
      .values([
        {
          user_id: testUserId,
          kanji_id: insertedKanji[0].id,
          correct_count: 1,
          incorrect_count: 0,
          current_interval: 2,
          ease_factor: 2.5,
          next_review_date: new Date(),
          last_reviewed_at: new Date()
        },
        {
          user_id: 'other-user',
          kanji_id: insertedKanji[1].id,
          correct_count: 5,
          incorrect_count: 2,
          current_interval: 10,
          ease_factor: 3.0,
          next_review_date: new Date(),
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserProgress(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].character).toEqual('山');
    expect(result[0].progress!.user_id).toEqual(testUserId);
    expect(result[0].progress!.correct_count).toEqual(1);
  });

  it('should return empty array when user has no progress', async () => {
    // Create kanji but no progress records
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    const result = await getUserProgress(testUserId);

    expect(result).toHaveLength(0);
  });

  it('should handle kanji with null readings correctly', async () => {
    // Create kanji with null readings
    const kanjiWithNullReadings = {
      character: '々',
      meaning: 'iteration mark',
      kun_reading: null,
      on_reading: null,
      romaji: null,
      jlpt_level: 'N3' as const
    };

    const insertedKanji = await db.insert(kanjiTable)
      .values([kanjiWithNullReadings])
      .returning()
      .execute();

    await db.insert(userProgressTable)
      .values([
        {
          user_id: testUserId,
          kanji_id: insertedKanji[0].id,
          correct_count: 3,
          incorrect_count: 1,
          current_interval: 7,
          ease_factor: 2.8,
          next_review_date: new Date(),
          last_reviewed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserProgress(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].kun_reading).toBeNull();
    expect(result[0].on_reading).toBeNull();
    expect(result[0].romaji).toBeNull();
    expect(result[0].progress).not.toBeNull();
    expect(result[0].progress!.correct_count).toEqual(3);
  });
});
