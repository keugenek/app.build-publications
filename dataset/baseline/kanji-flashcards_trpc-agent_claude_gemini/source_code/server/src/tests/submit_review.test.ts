import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable, reviewSessionsTable } from '../db/schema';
import { type SubmitReviewInput, type SRSLevel } from '../schema';
import { submitReview } from '../handlers/submit_review';
import { eq, and } from 'drizzle-orm';

describe('submitReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test kanji
  const createTestKanji = async () => {
    const result = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning: 'water',
        kun_reading: 'みず',
        on_reading: 'スイ',
        jlpt_level: 'N5',
        stroke_count: 4
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create user progress
  const createUserProgress = async (userId: string, kanjiId: number, overrides = {}) => {
    const nextReviewAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
    const result = await db.insert(userProgressTable)
      .values({
        user_id: userId,
        kanji_id: kanjiId,
        srs_level: 'APPRENTICE_1',
        next_review_at: nextReviewAt,
        correct_streak: 0,
        incorrect_count: 0,
        last_reviewed_at: null,
        ...overrides
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should process correct answer and advance SRS level', async () => {
    const kanji = await createTestKanji();
    await createUserProgress('user123', kanji.id);

    const input: SubmitReviewInput = {
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 2500
    };

    const result = await submitReview(input);

    // Verify progress update
    expect(result.user_id).toBe('user123');
    expect(result.kanji_id).toBe(kanji.id);
    expect(result.srs_level).toBe('APPRENTICE_2'); // Advanced from APPRENTICE_1
    expect(result.correct_streak).toBe(0); // Reset after advancement
    expect(result.incorrect_count).toBe(0);
    expect(result.last_reviewed_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Next review should be 8 hours from now (APPRENTICE_2 interval)
    const expectedInterval = 8 * 60 * 60 * 1000;
    const timeDiff = result.next_review_at!.getTime() - Date.now();
    expect(timeDiff).toBeGreaterThan(expectedInterval - 1000); // Allow 1s tolerance
    expect(timeDiff).toBeLessThan(expectedInterval + 1000);
  });

  it('should process incorrect answer and demote SRS level', async () => {
    const kanji = await createTestKanji();
    await createUserProgress('user123', kanji.id, {
      srs_level: 'GURU_1',
      correct_streak: 3
    });

    const input: SubmitReviewInput = {
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'INCORRECT',
      response_time_ms: 5000
    };

    const result = await submitReview(input);

    // Verify progress update
    expect(result.srs_level).toBe('APPRENTICE_4'); // Demoted from GURU_1
    expect(result.correct_streak).toBe(0); // Reset on incorrect answer
    expect(result.incorrect_count).toBe(1); // Incremented
    
    // Next review should be 2 days from now (APPRENTICE_4 interval)
    const expectedInterval = 2 * 24 * 60 * 60 * 1000;
    const timeDiff = result.next_review_at!.getTime() - Date.now();
    expect(timeDiff).toBeGreaterThan(expectedInterval - 1000);
    expect(timeDiff).toBeLessThan(expectedInterval + 1000);
  });

  it('should handle BURNED level with far future next_review_at', async () => {
    const kanji = await createTestKanji();
    await createUserProgress('user123', kanji.id, {
      srs_level: 'ENLIGHTENED',
      correct_streak: 0
    });

    const input: SubmitReviewInput = {
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 1500
    };

    const result = await submitReview(input);

    expect(result.srs_level).toBe('BURNED');
    // BURNED items have far future review date (1 year)
    const yearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
    const timeDiff = result.next_review_at.getTime() - yearFromNow;
    expect(Math.abs(timeDiff)).toBeLessThan(1000); // Allow 1s tolerance
    expect(result.correct_streak).toBe(0); // Reset after advancement
  });

  it('should record review session in database', async () => {
    const kanji = await createTestKanji();
    await createUserProgress('user123', kanji.id, {
      srs_level: 'APPRENTICE_2'
    });

    const input: SubmitReviewInput = {
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 3000
    };

    await submitReview(input);

    // Verify review session was recorded
    const sessions = await db.select()
      .from(reviewSessionsTable)
      .where(
        and(
          eq(reviewSessionsTable.user_id, 'user123'),
          eq(reviewSessionsTable.kanji_id, kanji.id)
        )
      )
      .execute();

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.result).toBe('CORRECT');
    expect(session.response_time_ms).toBe(3000);
    expect(session.previous_srs_level).toBe('APPRENTICE_2');
    expect(session.new_srs_level).toBe('APPRENTICE_3');
    expect(session.created_at).toBeInstanceOf(Date);
  });

  it('should not advance from APPRENTICE_1 to APPRENTICE_1 on incorrect', async () => {
    const kanji = await createTestKanji();
    await createUserProgress('user123', kanji.id, {
      srs_level: 'APPRENTICE_1'
    });

    const input: SubmitReviewInput = {
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'INCORRECT',
      response_time_ms: 4000
    };

    const result = await submitReview(input);

    expect(result.srs_level).toBe('APPRENTICE_1'); // Cannot demote further
    expect(result.correct_streak).toBe(0);
    expect(result.incorrect_count).toBe(1);
  });

  it('should handle multiple consecutive correct answers', async () => {
    const kanji = await createTestKanji();
    await createUserProgress('user123', kanji.id);

    // Submit first correct answer
    await submitReview({
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 2000
    });

    // Submit second correct answer
    const result = await submitReview({
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 1800
    });

    expect(result.srs_level).toBe('APPRENTICE_3'); // APPRENTICE_1 → APPRENTICE_2 → APPRENTICE_3
    expect(result.correct_streak).toBe(0); // Reset to 0 after each advancement
  });

  it('should handle progression through all SRS levels', async () => {
    const kanji = await createTestKanji();
    let progress = await createUserProgress('user123', kanji.id);

    const srsProgression: SRSLevel[] = [
      'APPRENTICE_1', 'APPRENTICE_2', 'APPRENTICE_3', 'APPRENTICE_4',
      'GURU_1', 'GURU_2', 'MASTER', 'ENLIGHTENED', 'BURNED'
    ];

    for (let i = 0; i < srsProgression.length - 1; i++) {
      expect(progress.srs_level).toBe(srsProgression[i]);
      
      progress = await submitReview({
        user_id: 'user123',
        kanji_id: kanji.id,
        result: 'CORRECT',
        response_time_ms: 2000
      });
    }

    expect(progress.srs_level).toBe('BURNED');
    // BURNED items have far future review date
    const yearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
    const timeDiff = progress.next_review_at.getTime() - yearFromNow;
    expect(Math.abs(timeDiff)).toBeLessThan(1000);
  });

  it('should throw error when user progress not found', async () => {
    const kanji = await createTestKanji();

    const input: SubmitReviewInput = {
      user_id: 'nonexistent_user',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 2000
    };

    await expect(submitReview(input)).rejects.toThrow(/User progress not found/);
  });

  it('should update timestamps correctly', async () => {
    const kanji = await createTestKanji();
    const beforeTime = new Date();
    await createUserProgress('user123', kanji.id);

    const input: SubmitReviewInput = {
      user_id: 'user123',
      kanji_id: kanji.id,
      result: 'CORRECT',
      response_time_ms: 2500
    };

    const result = await submitReview(input);
    const afterTime = new Date();

    expect(result.last_reviewed_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.last_reviewed_at!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.last_reviewed_at!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
