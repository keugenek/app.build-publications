import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjiTable, userProgressTable } from '../db/schema';
import { startLearningKanji } from '../handlers/start_learning_kanji';
import { eq, and } from 'drizzle-orm';

describe('startLearningKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testKanjiId: number;

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
  });

  it('should create new progress record for user-kanji pair', async () => {
    const result = await startLearningKanji(testUserId, testKanjiId);

    // Verify the returned progress record
    expect(result.user_id).toEqual(testUserId);
    expect(result.kanji_id).toEqual(testKanjiId);
    expect(result.srs_level).toEqual('APPRENTICE_1');
    expect(result.correct_streak).toEqual(0);
    expect(result.total_reviews).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.next_review_at).toBeInstanceOf(Date);

    // Verify next_review_at is approximately now (within 1 second)
    const now = new Date();
    const timeDiff = Math.abs(result.next_review_at.getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(1000);
  });

  it('should save progress record to database', async () => {
    const result = await startLearningKanji(testUserId, testKanjiId);

    // Query database to verify record was saved
    const progress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.id, result.id))
      .execute();

    expect(progress).toHaveLength(1);
    expect(progress[0].user_id).toEqual(testUserId);
    expect(progress[0].kanji_id).toEqual(testKanjiId);
    expect(progress[0].srs_level).toEqual('APPRENTICE_1');
    expect(progress[0].correct_streak).toEqual(0);
    expect(progress[0].total_reviews).toEqual(0);
    expect(progress[0].created_at).toBeInstanceOf(Date);
  });

  it('should return existing progress if already exists', async () => {
    // Create initial progress record
    const firstResult = await startLearningKanji(testUserId, testKanjiId);

    // Try to start learning the same kanji again
    const secondResult = await startLearningKanji(testUserId, testKanjiId);

    // Should return the same record
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.user_id).toEqual(firstResult.user_id);
    expect(secondResult.kanji_id).toEqual(firstResult.kanji_id);
    expect(secondResult.srs_level).toEqual(firstResult.srs_level);
    expect(secondResult.created_at).toEqual(firstResult.created_at);
    expect(secondResult.updated_at).toEqual(firstResult.updated_at);

    // Verify only one record exists in database
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, testUserId),
          eq(userProgressTable.kanji_id, testKanjiId)
        )
      )
      .execute();

    expect(allProgress).toHaveLength(1);
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 99999;

    await expect(startLearningKanji(nonExistentUserId, testKanjiId))
      .rejects
      .toThrow(/User with id 99999 not found/i);
  });

  it('should throw error for non-existent kanji', async () => {
    const nonExistentKanjiId = 99999;

    await expect(startLearningKanji(testUserId, nonExistentKanjiId))
      .rejects
      .toThrow(/Kanji with id 99999 not found/i);
  });

  it('should handle multiple users learning the same kanji', async () => {
    // Create second test user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        username: 'testuser2',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();
    const secondUserId = secondUserResult[0].id;

    // Both users start learning the same kanji
    const firstUserProgress = await startLearningKanji(testUserId, testKanjiId);
    const secondUserProgress = await startLearningKanji(secondUserId, testKanjiId);

    // Should create separate progress records
    expect(firstUserProgress.id).not.toEqual(secondUserProgress.id);
    expect(firstUserProgress.user_id).toEqual(testUserId);
    expect(secondUserProgress.user_id).toEqual(secondUserId);
    expect(firstUserProgress.kanji_id).toEqual(testKanjiId);
    expect(secondUserProgress.kanji_id).toEqual(testKanjiId);

    // Verify both records exist in database
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.kanji_id, testKanjiId))
      .execute();

    expect(allProgress).toHaveLength(2);
  });

  it('should handle one user learning multiple kanji', async () => {
    // Create second test kanji
    const secondKanjiResult = await db.insert(kanjiTable)
      .values({
        character: '火',
        meaning_english: 'fire',
        reading_hiragana: 'ひ',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();
    const secondKanjiId = secondKanjiResult[0].id;

    // User starts learning both kanji
    const firstKanjiProgress = await startLearningKanji(testUserId, testKanjiId);
    const secondKanjiProgress = await startLearningKanji(testUserId, secondKanjiId);

    // Should create separate progress records
    expect(firstKanjiProgress.id).not.toEqual(secondKanjiProgress.id);
    expect(firstKanjiProgress.user_id).toEqual(testUserId);
    expect(secondKanjiProgress.user_id).toEqual(testUserId);
    expect(firstKanjiProgress.kanji_id).toEqual(testKanjiId);
    expect(secondKanjiProgress.kanji_id).toEqual(secondKanjiId);

    // Verify both records exist in database
    const userProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.user_id, testUserId))
      .execute();

    expect(userProgress).toHaveLength(2);
  });
});
