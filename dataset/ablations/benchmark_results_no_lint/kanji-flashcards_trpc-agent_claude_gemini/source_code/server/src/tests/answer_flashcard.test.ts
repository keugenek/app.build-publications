import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type AnswerFlashcardInput } from '../schema';
import { answerFlashcard } from '../handlers/answer_flashcard';
import { eq, and } from 'drizzle-orm';

describe('answerFlashcard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create a test kanji before running tests
  let testKanjiId: number;

  beforeEach(async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning: 'water',
        kun_reading: 'みず',
        on_reading: 'スイ',
        romaji: 'mizu',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    testKanjiId = kanjiResult[0].id;
  });

  it('should create new progress record for first correct answer', async () => {
    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: testKanjiId,
      is_correct: true
    };

    const result = await answerFlashcard(input);

    // Validate return values
    expect(result.user_id).toEqual('user123');
    expect(result.kanji_id).toEqual(testKanjiId);
    expect(result.correct_count).toEqual(1);
    expect(result.incorrect_count).toEqual(0);
    expect(result.current_interval).toEqual(4);
    expect(result.ease_factor).toEqual(2.5);
    expect(result.id).toBeDefined();
    expect(result.last_reviewed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Check next review date is approximately 4 days from now
    const now = new Date();
    const expectedReviewDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const timeDiff = Math.abs(result.next_review_date.getTime() - expectedReviewDate.getTime());
    expect(timeDiff).toBeLessThan(60000); // Within 1 minute
  });

  it('should create new progress record for first incorrect answer', async () => {
    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: testKanjiId,
      is_correct: false
    };

    const result = await answerFlashcard(input);

    expect(result.user_id).toEqual('user123');
    expect(result.kanji_id).toEqual(testKanjiId);
    expect(result.correct_count).toEqual(0);
    expect(result.incorrect_count).toEqual(1);
    expect(result.current_interval).toEqual(1);
    expect(result.ease_factor).toEqual(2.3);
    expect(result.last_reviewed_at).toBeInstanceOf(Date);

    // Check next review date is approximately 1 day from now
    const now = new Date();
    const expectedReviewDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const timeDiff = Math.abs(result.next_review_date.getTime() - expectedReviewDate.getTime());
    expect(timeDiff).toBeLessThan(60000); // Within 1 minute
  });

  it('should update existing progress record for correct answer', async () => {
    // First, create initial progress
    await db.insert(userProgressTable)
      .values({
        user_id: 'user123',
        kanji_id: testKanjiId,
        correct_count: 1,
        incorrect_count: 0,
        current_interval: 4,
        ease_factor: 2.5,
        next_review_date: new Date(),
        last_reviewed_at: new Date()
      })
      .execute();

    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: testKanjiId,
      is_correct: true
    };

    const result = await answerFlashcard(input);

    expect(result.correct_count).toEqual(2);
    expect(result.incorrect_count).toEqual(0);
    expect(result.current_interval).toEqual(10); // 4 * 2.5 = 10
    expect(result.ease_factor).toEqual(2.5);

    // Verify database was updated
    const dbRecord = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, 'user123'),
          eq(userProgressTable.kanji_id, testKanjiId)
        )
      )
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].correct_count).toEqual(2);
    expect(dbRecord[0].current_interval).toEqual(10);
  });

  it('should update existing progress record for incorrect answer', async () => {
    // First, create initial progress with good stats
    await db.insert(userProgressTable)
      .values({
        user_id: 'user123',
        kanji_id: testKanjiId,
        correct_count: 3,
        incorrect_count: 0,
        current_interval: 10,
        ease_factor: 2.8,
        next_review_date: new Date(),
        last_reviewed_at: new Date()
      })
      .execute();

    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: testKanjiId,
      is_correct: false
    };

    const result = await answerFlashcard(input);

    expect(result.correct_count).toEqual(3);
    expect(result.incorrect_count).toEqual(1);
    expect(result.current_interval).toEqual(1); // Reset to 1
    expect(result.ease_factor).toEqual(2.6); // 2.8 - 0.2 = 2.6

    // Verify database was updated
    const dbRecord = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, 'user123'),
          eq(userProgressTable.kanji_id, testKanjiId)
        )
      )
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].incorrect_count).toEqual(1);
    expect(dbRecord[0].current_interval).toEqual(1);
    expect(dbRecord[0].ease_factor).toEqual(2.6);
  });

  it('should enforce minimum ease factor of 1.3', async () => {
    // Create progress with low ease factor
    await db.insert(userProgressTable)
      .values({
        user_id: 'user123',
        kanji_id: testKanjiId,
        correct_count: 1,
        incorrect_count: 3,
        current_interval: 1,
        ease_factor: 1.4, // Just above minimum
        next_review_date: new Date(),
        last_reviewed_at: new Date()
      })
      .execute();

    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: testKanjiId,
      is_correct: false
    };

    const result = await answerFlashcard(input);

    expect(result.ease_factor).toEqual(1.3); // Should be clamped to minimum
    expect(result.incorrect_count).toEqual(4);
    expect(result.current_interval).toEqual(1);
  });

  it('should handle multiple users for same kanji independently', async () => {
    // Create progress for first user
    const input1: AnswerFlashcardInput = {
      user_id: 'user1',
      kanji_id: testKanjiId,
      is_correct: true
    };

    // Create progress for second user
    const input2: AnswerFlashcardInput = {
      user_id: 'user2',
      kanji_id: testKanjiId,
      is_correct: false
    };

    const result1 = await answerFlashcard(input1);
    const result2 = await answerFlashcard(input2);

    // Both should have different progress
    expect(result1.user_id).toEqual('user1');
    expect(result1.correct_count).toEqual(1);
    expect(result1.current_interval).toEqual(4);

    expect(result2.user_id).toEqual('user2');
    expect(result2.incorrect_count).toEqual(1);
    expect(result2.current_interval).toEqual(1);

    // Verify both records exist in database
    const allRecords = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.kanji_id, testKanjiId))
      .execute();

    expect(allRecords).toHaveLength(2);
  });

  it('should calculate interval correctly for successive correct answers', async () => {
    // Start with a correct answer
    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: testKanjiId,
      is_correct: true
    };

    // First correct answer
    const result1 = await answerFlashcard(input);
    expect(result1.current_interval).toEqual(4);
    expect(result1.ease_factor).toEqual(2.5);

    // Second correct answer
    const result2 = await answerFlashcard(input);
    expect(result2.current_interval).toEqual(10); // 4 * 2.5 = 10
    expect(result2.ease_factor).toEqual(2.5);

    // Third correct answer
    const result3 = await answerFlashcard(input);
    expect(result3.current_interval).toEqual(25); // 10 * 2.5 = 25
    expect(result3.ease_factor).toEqual(2.5);
  });

  it('should handle invalid kanji_id gracefully', async () => {
    const input: AnswerFlashcardInput = {
      user_id: 'user123',
      kanji_id: 99999, // Non-existent kanji
      is_correct: true
    };

    // Should throw error due to foreign key constraint
    expect(answerFlashcard(input)).rejects.toThrow(/foreign key constraint|violates/i);
  });
});
