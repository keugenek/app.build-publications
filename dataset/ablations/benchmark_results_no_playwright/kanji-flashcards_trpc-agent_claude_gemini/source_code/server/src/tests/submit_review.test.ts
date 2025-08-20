import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjiTable, userProgressTable, reviewHistoryTable } from '../db/schema';
import { type SubmitReviewInput, type SRSLevel } from '../schema';
import { submitReview } from '../handlers/submit_review';
import { eq, and } from 'drizzle-orm';

describe('submitReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testKanjiId: number;
  let testProgressId: number;

  beforeEach(async () => {
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

    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning_english: 'water',
        reading_hiragana: 'みず',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();
    testKanjiId = kanjiResult[0].id;

    // Create initial progress record
    const progressResult = await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        kanji_id: testKanjiId,
        srs_level: 'APPRENTICE_1',
        next_review_at: new Date(), // Due for review now
        correct_streak: 0,
        total_reviews: 0
      })
      .returning()
      .execute();
    testProgressId = progressResult[0].id;
  });

  describe('correct answers', () => {
    it('should advance from APPRENTICE_1 to APPRENTICE_2 on correct answer', async () => {
      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 3000
      };

      const result = await submitReview(input);

      expect(result.srs_level).toBe('APPRENTICE_2');
      expect(result.correct_streak).toBe(1);
      expect(result.total_reviews).toBe(1);
      expect(result.updated_at).toBeInstanceOf(Date);
      
      // Check next review is scheduled for 8 hours (APPRENTICE_2 interval)
      const now = new Date();
      const expectedNextReview = new Date(now);
      expectedNextReview.setHours(expectedNextReview.getHours() + 8);
      
      const timeDiff = Math.abs(result.next_review_at.getTime() - expectedNextReview.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute tolerance
    });

    it('should advance through all SRS levels correctly', async () => {
      const srsLevels: SRSLevel[] = [
        'APPRENTICE_1', 'APPRENTICE_2', 'APPRENTICE_3', 'APPRENTICE_4',
        'GURU_1', 'GURU_2', 'MASTER', 'ENLIGHTENED', 'BURNED'
      ];

      for (let i = 0; i < srsLevels.length - 1; i++) {
        const currentLevel = srsLevels[i];
        const expectedNextLevel = srsLevels[i + 1];

        // Update progress to current level
        await db.update(userProgressTable)
          .set({ srs_level: currentLevel })
          .where(eq(userProgressTable.id, testProgressId))
          .execute();

        const input: SubmitReviewInput = {
          user_id: testUserId,
          kanji_id: testKanjiId,
          result: 'CORRECT',
          review_time_ms: 2000
        };

        const result = await submitReview(input);
        expect(result.srs_level).toBe(expectedNextLevel);
      }
    });

    it('should stay at BURNED level on correct answer', async () => {
      // Set progress to BURNED level
      await db.update(userProgressTable)
        .set({ srs_level: 'BURNED' })
        .where(eq(userProgressTable.id, testProgressId))
        .execute();

      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 1500
      };

      const result = await submitReview(input);
      expect(result.srs_level).toBe('BURNED');
    });

    it('should increment correct streak on multiple correct answers', async () => {
      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 2500
      };

      // First correct answer
      let result = await submitReview(input);
      expect(result.correct_streak).toBe(1);

      // Second correct answer
      result = await submitReview(input);
      expect(result.correct_streak).toBe(2);

      // Third correct answer
      result = await submitReview(input);
      expect(result.correct_streak).toBe(3);
    });
  });

  describe('incorrect answers', () => {
    it('should reset correct streak on incorrect answer', async () => {
      // First, make some correct answers to build streak
      await db.update(userProgressTable)
        .set({ correct_streak: 5 })
        .where(eq(userProgressTable.id, testProgressId))
        .execute();

      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'INCORRECT',
        review_time_ms: 8000
      };

      const result = await submitReview(input);
      expect(result.correct_streak).toBe(0);
    });

    it('should demote APPRENTICE levels to APPRENTICE_1', async () => {
      const apprenticeLevels: SRSLevel[] = ['APPRENTICE_1', 'APPRENTICE_2'];
      
      for (const level of apprenticeLevels) {
        await db.update(userProgressTable)
          .set({ srs_level: level })
          .where(eq(userProgressTable.id, testProgressId))
          .execute();

        const input: SubmitReviewInput = {
          user_id: testUserId,
          kanji_id: testKanjiId,
          result: 'INCORRECT',
          review_time_ms: 5000
        };

        const result = await submitReview(input);
        expect(result.srs_level).toBe('APPRENTICE_1');
      }
    });

    it('should demote APPRENTICE_3/4 to APPRENTICE_2', async () => {
      const apprenticeLevels: SRSLevel[] = ['APPRENTICE_3', 'APPRENTICE_4'];
      
      for (const level of apprenticeLevels) {
        await db.update(userProgressTable)
          .set({ srs_level: level })
          .where(eq(userProgressTable.id, testProgressId))
          .execute();

        const input: SubmitReviewInput = {
          user_id: testUserId,
          kanji_id: testKanjiId,
          result: 'INCORRECT',
          review_time_ms: 6000
        };

        const result = await submitReview(input);
        expect(result.srs_level).toBe('APPRENTICE_2');
      }
    });

    it('should demote GURU levels to APPRENTICE_3', async () => {
      const guruLevels: SRSLevel[] = ['GURU_1', 'GURU_2'];
      
      for (const level of guruLevels) {
        await db.update(userProgressTable)
          .set({ srs_level: level })
          .where(eq(userProgressTable.id, testProgressId))
          .execute();

        const input: SubmitReviewInput = {
          user_id: testUserId,
          kanji_id: testKanjiId,
          result: 'INCORRECT',
          review_time_ms: 4500
        };

        const result = await submitReview(input);
        expect(result.srs_level).toBe('APPRENTICE_3');
      }
    });

    it('should demote high levels (MASTER/ENLIGHTENED/BURNED) to GURU_1', async () => {
      const highLevels: SRSLevel[] = ['MASTER', 'ENLIGHTENED', 'BURNED'];
      
      for (const level of highLevels) {
        await db.update(userProgressTable)
          .set({ srs_level: level })
          .where(eq(userProgressTable.id, testProgressId))
          .execute();

        const input: SubmitReviewInput = {
          user_id: testUserId,
          kanji_id: testKanjiId,
          result: 'INCORRECT',
          review_time_ms: 7000
        };

        const result = await submitReview(input);
        expect(result.srs_level).toBe('GURU_1');
      }
    });
  });

  describe('review history tracking', () => {
    it('should create review history record', async () => {
      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 2500
      };

      await submitReview(input);

      const reviewHistory = await db.select()
        .from(reviewHistoryTable)
        .where(
          and(
            eq(reviewHistoryTable.user_id, testUserId),
            eq(reviewHistoryTable.kanji_id, testKanjiId)
          )
        )
        .execute();

      expect(reviewHistory).toHaveLength(1);
      expect(reviewHistory[0].result).toBe('CORRECT');
      expect(reviewHistory[0].previous_srs_level).toBe('APPRENTICE_1');
      expect(reviewHistory[0].new_srs_level).toBe('APPRENTICE_2');
      expect(reviewHistory[0].review_time_ms).toBe(2500);
      expect(reviewHistory[0].created_at).toBeInstanceOf(Date);
    });

    it('should track multiple review attempts', async () => {
      // First review - correct
      await submitReview({
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 2000
      });

      // Second review - incorrect
      await submitReview({
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'INCORRECT',
        review_time_ms: 5000
      });

      const reviewHistory = await db.select()
        .from(reviewHistoryTable)
        .where(
          and(
            eq(reviewHistoryTable.user_id, testUserId),
            eq(reviewHistoryTable.kanji_id, testKanjiId)
          )
        )
        .execute();

      expect(reviewHistory).toHaveLength(2);
      
      // First review should show APPRENTICE_1 -> APPRENTICE_2
      expect(reviewHistory[0].result).toBe('CORRECT');
      expect(reviewHistory[0].previous_srs_level).toBe('APPRENTICE_1');
      expect(reviewHistory[0].new_srs_level).toBe('APPRENTICE_2');
      
      // Second review should show APPRENTICE_2 -> APPRENTICE_1 (demotion)
      expect(reviewHistory[1].result).toBe('INCORRECT');
      expect(reviewHistory[1].previous_srs_level).toBe('APPRENTICE_2');
      expect(reviewHistory[1].new_srs_level).toBe('APPRENTICE_1');
    });
  });

  describe('database state updates', () => {
    it('should increment total_reviews counter', async () => {
      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 3000
      };

      // Initial total_reviews should be 0
      let progress = await db.select()
        .from(userProgressTable)
        .where(eq(userProgressTable.id, testProgressId))
        .execute();
      expect(progress[0].total_reviews).toBe(0);

      // After first review
      await submitReview(input);
      progress = await db.select()
        .from(userProgressTable)
        .where(eq(userProgressTable.id, testProgressId))
        .execute();
      expect(progress[0].total_reviews).toBe(1);

      // After second review
      await submitReview(input);
      progress = await db.select()
        .from(userProgressTable)
        .where(eq(userProgressTable.id, testProgressId))
        .execute();
      expect(progress[0].total_reviews).toBe(2);
    });

    it('should update updated_at timestamp', async () => {
      const originalProgress = await db.select()
        .from(userProgressTable)
        .where(eq(userProgressTable.id, testProgressId))
        .execute();
      const originalUpdatedAt = originalProgress[0].updated_at;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 2000
      };

      const result = await submitReview(input);
      expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('error handling', () => {
    it('should throw error when progress record does not exist', async () => {
      const input: SubmitReviewInput = {
        user_id: 99999, // Non-existent user
        kanji_id: testKanjiId,
        result: 'CORRECT',
        review_time_ms: 2000
      };

      expect(submitReview(input)).rejects.toThrow(/No progress record found/i);
    });

    it('should throw error when kanji does not exist in progress', async () => {
      const input: SubmitReviewInput = {
        user_id: testUserId,
        kanji_id: 99999, // Non-existent kanji
        result: 'CORRECT',
        review_time_ms: 2000
      };

      expect(submitReview(input)).rejects.toThrow(/No progress record found/i);
    });
  });
});
