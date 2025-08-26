import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjiTable, userProgressTable } from '../db/schema';
import { type GetDueReviewsInput } from '../schema';
import { getDueReviews } from '../handlers/get_due_reviews';

// Test data setup
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  password_hash: 'hashed_password'
};

const testKanji1 = {
  character: '人',
  meaning_english: 'person, human',
  reading_hiragana: 'ひと、じん',
  reading_katakana: null,
  jlpt_level: 'N5' as const
};

const testKanji2 = {
  character: '水',
  meaning_english: 'water',
  reading_hiragana: 'みず、すい',
  reading_katakana: null,
  jlpt_level: 'N5' as const
};

const testKanji3 = {
  character: '火',
  meaning_english: 'fire',
  reading_hiragana: 'ひ、か',
  reading_katakana: null,
  jlpt_level: 'N5' as const
};

describe('getDueReviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return due reviews for user', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1, testKanji2])
      .returning()
      .execute();
    const kanji1Id = kanjiResults[0].id;
    const kanji2Id = kanjiResults[1].id;

    // Create user progress - one due for review, one not due
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1); // 1 hour ago
    
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 1); // 1 hour from now

    await db.insert(userProgressTable)
      .values([
        {
          user_id: userId,
          kanji_id: kanji1Id,
          srs_level: 'APPRENTICE_1' as const,
          next_review_at: pastTime, // Due for review
          correct_streak: 1,
          total_reviews: 2
        },
        {
          user_id: userId,
          kanji_id: kanji2Id,
          srs_level: 'GURU_1' as const,
          next_review_at: futureTime, // Not due for review
          correct_streak: 5,
          total_reviews: 8
        }
      ])
      .execute();

    const input: GetDueReviewsInput = {
      user_id: userId,
      limit: 20
    };

    const results = await getDueReviews(input);

    // Should only return the kanji due for review
    expect(results).toHaveLength(1);
    
    const dueReview = results[0];
    expect(dueReview.character).toEqual('人');
    expect(dueReview.meaning_english).toEqual('person, human');
    expect(dueReview.reading_hiragana).toEqual('ひと、じん');
    expect(dueReview.reading_katakana).toBeNull();
    expect(dueReview.jlpt_level).toEqual('N5');
    expect(dueReview.id).toBeDefined();
    expect(dueReview.created_at).toBeInstanceOf(Date);

    // Check user progress data
    expect(dueReview.user_progress).toBeDefined();
    expect(dueReview.user_progress!.user_id).toEqual(userId);
    expect(dueReview.user_progress!.kanji_id).toEqual(kanji1Id);
    expect(dueReview.user_progress!.srs_level).toEqual('APPRENTICE_1');
    expect(dueReview.user_progress!.correct_streak).toEqual(1);
    expect(dueReview.user_progress!.total_reviews).toEqual(2);
    expect(dueReview.user_progress!.next_review_at).toBeInstanceOf(Date);
    expect(dueReview.user_progress!.created_at).toBeInstanceOf(Date);
    expect(dueReview.user_progress!.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no reviews are due', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1])
      .returning()
      .execute();
    const kanji1Id = kanjiResults[0].id;

    // Create user progress with future review time
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        kanji_id: kanji1Id,
        srs_level: 'APPRENTICE_2' as const,
        next_review_at: futureTime,
        correct_streak: 0,
        total_reviews: 1
      })
      .execute();

    const input: GetDueReviewsInput = {
      user_id: userId,
      limit: 20
    };

    const results = await getDueReviews(input);

    expect(results).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create multiple test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1, testKanji2, testKanji3])
      .returning()
      .execute();

    // Create multiple user progress entries all due for review
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    const progressEntries = kanjiResults.map(kanji => ({
      user_id: userId,
      kanji_id: kanji.id,
      srs_level: 'APPRENTICE_1' as const,
      next_review_at: pastTime,
      correct_streak: 0,
      total_reviews: 1
    }));

    await db.insert(userProgressTable)
      .values(progressEntries)
      .execute();

    const input: GetDueReviewsInput = {
      user_id: userId,
      limit: 2
    };

    const results = await getDueReviews(input);

    // Should only return 2 results despite having 3 due reviews
    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.user_progress).toBeDefined();
      expect(result.user_progress!.user_id).toEqual(userId);
    });
  });

  it('should order results by next_review_at (oldest first)', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test kanji
    const kanjiResults = await db.insert(kanjiTable)
      .values([testKanji1, testKanji2])
      .returning()
      .execute();
    const kanji1Id = kanjiResults[0].id;
    const kanji2Id = kanjiResults[1].id;

    // Create user progress with different review times
    const olderTime = new Date();
    olderTime.setHours(olderTime.getHours() - 2); // 2 hours ago
    
    const newerTime = new Date();
    newerTime.setHours(newerTime.getHours() - 1); // 1 hour ago

    await db.insert(userProgressTable)
      .values([
        {
          user_id: userId,
          kanji_id: kanji2Id, // Insert second kanji first
          srs_level: 'APPRENTICE_2' as const,
          next_review_at: newerTime, // More recent time
          correct_streak: 1,
          total_reviews: 2
        },
        {
          user_id: userId,
          kanji_id: kanji1Id, // Insert first kanji second
          srs_level: 'APPRENTICE_1' as const,
          next_review_at: olderTime, // Older time
          correct_streak: 0,
          total_reviews: 1
        }
      ])
      .execute();

    const input: GetDueReviewsInput = {
      user_id: userId,
      limit: 20
    };

    const results = await getDueReviews(input);

    expect(results).toHaveLength(2);
    
    // First result should be the one with older review time
    expect(results[0].character).toEqual('人'); // kanji1
    expect(results[0].user_progress!.next_review_at).toEqual(olderTime);
    
    // Second result should be the one with newer review time
    expect(results[1].character).toEqual('水'); // kanji2
    expect(results[1].user_progress!.next_review_at).toEqual(newerTime);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetDueReviewsInput = {
      user_id: 99999, // Non-existent user ID
      limit: 20
    };

    const results = await getDueReviews(input);

    expect(results).toHaveLength(0);
  });

  it('should handle default limit from schema', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    const input: GetDueReviewsInput = {
      user_id: userId,
      limit: 20 // Default from schema
    };

    // Should not throw error even with default limit
    const results = await getDueReviews(input);

    expect(results).toEqual([]);
  });
});
