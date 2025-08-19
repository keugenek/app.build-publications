import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type StartKanjiStudyInput, type CreateKanjiInput } from '../schema';
import { startKanjiStudy } from '../handlers/start_kanji_study';
import { eq, and } from 'drizzle-orm';

// Test kanji data
const testKanji: CreateKanjiInput = {
  character: '水',
  meaning: 'water',
  kun_reading: 'みず',
  on_reading: 'スイ',
  jlpt_level: 'N5',
  stroke_count: 4
};

const testInput: StartKanjiStudyInput = {
  user_id: 'user123',
  kanji_id: 1 // Will be set after creating kanji
};

describe('startKanjiStudy', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let kanjiId: number;

  beforeEach(async () => {
    // Create a test kanji first
    const kanjiResult = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();
    
    kanjiId = kanjiResult[0].id;
    testInput.kanji_id = kanjiId;
  });

  it('should create user progress for new kanji study', async () => {
    const result = await startKanjiStudy(testInput);

    // Validate basic fields
    expect(result.user_id).toEqual('user123');
    expect(result.kanji_id).toEqual(kanjiId);
    expect(result.srs_level).toEqual('APPRENTICE_1');
    expect(result.correct_streak).toEqual(0);
    expect(result.incorrect_count).toEqual(0);
    expect(result.last_reviewed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify next_review_at is approximately 4 hours from now
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const timeDiff = Math.abs(result.next_review_at.getTime() - fourHoursFromNow.getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds tolerance
  });

  it('should save progress to database', async () => {
    const result = await startKanjiStudy(testInput);

    // Query database to verify the record was saved
    const progressRecords = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.id, result.id))
      .execute();

    expect(progressRecords).toHaveLength(1);
    const savedProgress = progressRecords[0];
    
    expect(savedProgress.user_id).toEqual('user123');
    expect(savedProgress.kanji_id).toEqual(kanjiId);
    expect(savedProgress.srs_level).toEqual('APPRENTICE_1');
    expect(savedProgress.correct_streak).toEqual(0);
    expect(savedProgress.incorrect_count).toEqual(0);
    expect(savedProgress.last_reviewed_at).toBeNull();
    expect(savedProgress.created_at).toBeInstanceOf(Date);
    expect(savedProgress.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when kanji does not exist', async () => {
    const invalidInput: StartKanjiStudyInput = {
      user_id: 'user123',
      kanji_id: 9999 // Non-existent kanji ID
    };

    await expect(startKanjiStudy(invalidInput))
      .rejects
      .toThrow(/kanji with id 9999 not found/i);
  });

  it('should throw error when user already studying the kanji', async () => {
    // First, start studying the kanji
    await startKanjiStudy(testInput);

    // Try to start studying the same kanji again
    await expect(startKanjiStudy(testInput))
      .rejects
      .toThrow(/already studying kanji with id/i);
  });

  it('should allow different users to study the same kanji', async () => {
    const user1Input: StartKanjiStudyInput = {
      user_id: 'user1',
      kanji_id: kanjiId
    };

    const user2Input: StartKanjiStudyInput = {
      user_id: 'user2',
      kanji_id: kanjiId
    };

    // Both users should be able to start studying the same kanji
    const result1 = await startKanjiStudy(user1Input);
    const result2 = await startKanjiStudy(user2Input);

    expect(result1.user_id).toEqual('user1');
    expect(result2.user_id).toEqual('user2');
    expect(result1.kanji_id).toEqual(kanjiId);
    expect(result2.kanji_id).toEqual(kanjiId);

    // Verify both records exist in database
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.kanji_id, kanjiId))
      .execute();

    expect(allProgress).toHaveLength(2);
    const userIds = allProgress.map(p => p.user_id).sort();
    expect(userIds).toEqual(['user1', 'user2']);
  });

  it('should allow same user to study different kanji', async () => {
    // Create a second kanji
    const secondKanji: CreateKanjiInput = {
      character: '火',
      meaning: 'fire',
      kun_reading: 'ひ',
      on_reading: 'カ',
      jlpt_level: 'N5',
      stroke_count: 4
    };

    const secondKanjiResult = await db.insert(kanjiTable)
      .values(secondKanji)
      .returning()
      .execute();

    const secondKanjiId = secondKanjiResult[0].id;

    const firstStudy: StartKanjiStudyInput = {
      user_id: 'user123',
      kanji_id: kanjiId
    };

    const secondStudy: StartKanjiStudyInput = {
      user_id: 'user123',
      kanji_id: secondKanjiId
    };

    // User should be able to study both kanji
    const result1 = await startKanjiStudy(firstStudy);
    const result2 = await startKanjiStudy(secondStudy);

    expect(result1.user_id).toEqual('user123');
    expect(result2.user_id).toEqual('user123');
    expect(result1.kanji_id).toEqual(kanjiId);
    expect(result2.kanji_id).toEqual(secondKanjiId);

    // Verify both records exist in database
    const userProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.user_id, 'user123'))
      .execute();

    expect(userProgress).toHaveLength(2);
    const kanjiIds = userProgress.map(p => p.kanji_id).sort();
    expect(kanjiIds).toEqual([kanjiId, secondKanjiId].sort());
  });

  it('should set correct initial values for all progress fields', async () => {
    const result = await startKanjiStudy(testInput);

    // Verify all initial values are correct
    expect(result.srs_level).toEqual('APPRENTICE_1');
    expect(result.correct_streak).toEqual(0);
    expect(result.incorrect_count).toEqual(0);
    expect(result.last_reviewed_at).toBeNull();
    
    // Verify timestamps are recent
    const now = new Date();
    const timeDiff = Math.abs(result.created_at.getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    
    const updateTimeDiff = Math.abs(result.updated_at.getTime() - now.getTime());
    expect(updateTimeDiff).toBeLessThan(5000); // Within 5 seconds
  });
});
