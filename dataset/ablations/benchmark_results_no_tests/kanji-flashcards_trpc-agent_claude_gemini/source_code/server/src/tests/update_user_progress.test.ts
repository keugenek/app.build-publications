import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type UpdateUserProgressInput } from '../schema';
import { updateUserProgress } from '../handlers/update_user_progress';
import { eq, and } from 'drizzle-orm';

describe('updateUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test kanji
  const createTestKanji = async () => {
    const result = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning: 'water',
        on_reading: 'スイ',
        kun_reading: 'みず',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper to create test user progress
  const createTestUserProgress = async (kanjiId: number) => {
    const result = await db.insert(userProgressTable)
      .values({
        user_id: 'test-user-123',
        kanji_id: kanjiId,
        is_learned: false,
        review_count: 0,
        last_reviewed: null,
        next_review: null
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update is_learned status', async () => {
    const kanji = await createTestKanji();
    const progress = await createTestUserProgress(kanji.id);

    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      is_learned: true
    };

    const result = await updateUserProgress(input);

    expect(result.is_learned).toBe(true);
    expect(result.user_id).toBe('test-user-123');
    expect(result.kanji_id).toBe(kanji.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(progress.updated_at.getTime());
  });

  it('should update review_count and calculate next_review with SRS', async () => {
    const kanji = await createTestKanji();
    await createTestUserProgress(kanji.id);

    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      review_count: 2
    };

    const result = await updateUserProgress(input);

    expect(result.review_count).toBe(2);
    expect(result.last_reviewed).toBeInstanceOf(Date);
    expect(result.next_review).toBeInstanceOf(Date);
    
    // For review_count = 2, SRS interval should be 7 days
    const expectedNextReview = new Date();
    expectedNextReview.setDate(expectedNextReview.getDate() + 7);
    
    const nextReviewDate = result.next_review as Date;
    const timeDifference = Math.abs(nextReviewDate.getTime() - expectedNextReview.getTime());
    expect(timeDifference).toBeLessThan(60000); // Within 1 minute
  });

  it('should handle explicit next_review override', async () => {
    const kanji = await createTestKanji();
    await createTestUserProgress(kanji.id);

    const customNextReview = new Date();
    customNextReview.setDate(customNextReview.getDate() + 30);

    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      review_count: 1,
      next_review: customNextReview
    };

    const result = await updateUserProgress(input);

    expect(result.review_count).toBe(1);
    expect(result.next_review).toEqual(customNextReview);
  });

  it('should update multiple fields simultaneously', async () => {
    const kanji = await createTestKanji();
    await createTestUserProgress(kanji.id);

    const lastReviewedDate = new Date();
    lastReviewedDate.setDate(lastReviewedDate.getDate() - 1);

    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      is_learned: true,
      review_count: 3,
      last_reviewed: lastReviewedDate
    };

    const result = await updateUserProgress(input);

    expect(result.is_learned).toBe(true);
    expect(result.review_count).toBe(3);
    expect(result.last_reviewed).toEqual(lastReviewedDate);
    expect(result.next_review).toBeInstanceOf(Date);
    
    // For review_count = 3, SRS interval should be 14 days
    const expectedNextReview = new Date();
    expectedNextReview.setDate(expectedNextReview.getDate() + 14);
    
    const nextReviewDate = result.next_review as Date;
    const timeDifference = Math.abs(nextReviewDate.getTime() - expectedNextReview.getTime());
    expect(timeDifference).toBeLessThan(60000); // Within 1 minute
  });

  it('should persist updates to database', async () => {
    const kanji = await createTestKanji();
    await createTestUserProgress(kanji.id);

    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      is_learned: true,
      review_count: 5
    };

    await updateUserProgress(input);

    // Query database directly to verify persistence
    const savedProgress = await db
      .select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, 'test-user-123'),
          eq(userProgressTable.kanji_id, kanji.id)
        )
      )
      .execute();

    expect(savedProgress).toHaveLength(1);
    expect(savedProgress[0].is_learned).toBe(true);
    expect(savedProgress[0].review_count).toBe(5);
    expect(savedProgress[0].last_reviewed).toBeInstanceOf(Date);
    expect(savedProgress[0].next_review).toBeInstanceOf(Date);
  });

  it('should handle SRS intervals correctly for high review counts', async () => {
    const kanji = await createTestKanji();
    await createTestUserProgress(kanji.id);

    // Test with very high review count (should cap at last SRS interval)
    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      review_count: 10 // Higher than SRS_INTERVALS array length
    };

    const result = await updateUserProgress(input);

    expect(result.review_count).toBe(10);
    expect(result.next_review).toBeInstanceOf(Date);
    
    // Should use the last interval (180 days)
    const expectedNextReview = new Date();
    expectedNextReview.setDate(expectedNextReview.getDate() + 180);
    
    const nextReviewDate = result.next_review as Date;
    const timeDifference = Math.abs(nextReviewDate.getTime() - expectedNextReview.getTime());
    expect(timeDifference).toBeLessThan(60000); // Within 1 minute
  });

  it('should throw error when user progress does not exist', async () => {
    const kanji = await createTestKanji();

    const input: UpdateUserProgressInput = {
      user_id: 'nonexistent-user',
      kanji_id: kanji.id,
      is_learned: true
    };

    expect(updateUserProgress(input)).rejects.toThrow(/User progress not found/i);
  });

  it('should handle null values correctly', async () => {
    const kanji = await createTestKanji();
    const progress = await createTestUserProgress(kanji.id);

    // Set some initial values
    await db.update(userProgressTable)
      .set({
        last_reviewed: new Date(),
        next_review: new Date()
      })
      .where(eq(userProgressTable.id, progress.id))
      .execute();

    const input: UpdateUserProgressInput = {
      user_id: 'test-user-123',
      kanji_id: kanji.id,
      last_reviewed: null,
      next_review: null
    };

    const result = await updateUserProgress(input);

    expect(result.last_reviewed).toBe(null);
    expect(result.next_review).toBe(null);
  });
});
