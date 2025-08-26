import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetUserProgressByLevelInput } from '../schema';
import { getUserProgress } from '../handlers/get_user_progress';

// Helper function to create test kanji
const createTestKanji = async (character: string, jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1') => {
  const result = await db.insert(kanjiTable)
    .values({
      character,
      meaning: `Test meaning for ${character}`,
      on_reading: `on_${character}`,
      kun_reading: `kun_${character}`,
      jlpt_level: jlptLevel
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create test progress
const createTestProgress = async (userId: string, kanjiId: number, isLearned: boolean = false) => {
  const result = await db.insert(userProgressTable)
    .values({
      user_id: userId,
      kanji_id: kanjiId,
      is_learned: isLearned,
      review_count: isLearned ? 3 : 1,
      last_reviewed: isLearned ? new Date() : null,
      next_review: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    })
    .returning()
    .execute();
  return result[0];
};

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all progress records for a user', async () => {
    // Create test kanji
    const kanji1 = await createTestKanji('水', 'N5');
    const kanji2 = await createTestKanji('火', 'N4');

    // Create progress records
    await createTestProgress('user1', kanji1.id, true);
    await createTestProgress('user1', kanji2.id, false);

    // Create progress for different user (should not be returned)
    await createTestProgress('user2', kanji1.id, true);

    const input: GetUserProgressByLevelInput = {
      user_id: 'user1'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(2);
    expect(result.every(p => p.user_id === 'user1')).toBe(true);
    
    // Verify data structure
    const learnedProgress = result.find(p => p.is_learned);
    const unlearnedProgress = result.find(p => !p.is_learned);
    
    expect(learnedProgress).toBeDefined();
    expect(learnedProgress!.review_count).toBe(3);
    expect(learnedProgress!.last_reviewed).toBeInstanceOf(Date);
    
    expect(unlearnedProgress).toBeDefined();
    expect(unlearnedProgress!.review_count).toBe(1);
    expect(unlearnedProgress!.last_reviewed).toBeNull();
    
    // Verify all dates are properly converted
    result.forEach(progress => {
      expect(progress.created_at).toBeInstanceOf(Date);
      expect(progress.updated_at).toBeInstanceOf(Date);
      expect(progress.next_review).toBeInstanceOf(Date);
    });
  });

  it('should filter progress by JLPT level when specified', async () => {
    // Create kanji of different levels
    const kanjiN5 = await createTestKanji('水', 'N5');
    const kanjiN4 = await createTestKanji('火', 'N4');
    const kanjiN3 = await createTestKanji('金', 'N3');

    // Create progress for all kanji
    await createTestProgress('user1', kanjiN5.id, true);
    await createTestProgress('user1', kanjiN4.id, false);
    await createTestProgress('user1', kanjiN3.id, true);

    const input: GetUserProgressByLevelInput = {
      user_id: 'user1',
      jlpt_level: 'N4'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('user1');
    expect(result[0].kanji_id).toBe(kanjiN4.id);
    expect(result[0].is_learned).toBe(false);
  });

  it('should return empty array for user with no progress', async () => {
    // Create kanji but no progress
    await createTestKanji('水', 'N5');

    const input: GetUserProgressByLevelInput = {
      user_id: 'nonexistent_user'
    };

    const result = await getUserProgress(input);
    expect(result).toHaveLength(0);
  });

  it('should return empty array when filtering by level with no matching progress', async () => {
    // Create N5 kanji with progress
    const kanjiN5 = await createTestKanji('水', 'N5');
    await createTestProgress('user1', kanjiN5.id, true);

    // Filter by N3 level (no progress exists)
    const input: GetUserProgressByLevelInput = {
      user_id: 'user1',
      jlpt_level: 'N3'
    };

    const result = await getUserProgress(input);
    expect(result).toHaveLength(0);
  });

  it('should handle multiple progress records for same level', async () => {
    // Create multiple N4 kanji
    const kanji1 = await createTestKanji('水', 'N4');
    const kanji2 = await createTestKanji('火', 'N4');
    const kanji3 = await createTestKanji('金', 'N4');

    // Create progress for all
    await createTestProgress('user1', kanji1.id, true);
    await createTestProgress('user1', kanji2.id, false);
    await createTestProgress('user1', kanji3.id, true);

    const input: GetUserProgressByLevelInput = {
      user_id: 'user1',
      jlpt_level: 'N4'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(3);
    expect(result.every(p => p.user_id === 'user1')).toBe(true);
    
    // Verify we have the expected mix of learned/unlearned
    const learnedCount = result.filter(p => p.is_learned).length;
    const unlearnedCount = result.filter(p => !p.is_learned).length;
    
    expect(learnedCount).toBe(2);
    expect(unlearnedCount).toBe(1);
  });

  it('should handle progress with null timestamp fields', async () => {
    const kanji = await createTestKanji('水', 'N5');
    
    // Create progress with minimal data (nulls for timestamps)
    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanji.id,
        is_learned: false,
        review_count: 0,
        last_reviewed: null,
        next_review: null
      })
      .execute();

    const input: GetUserProgressByLevelInput = {
      user_id: 'user1'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].last_reviewed).toBeNull();
    expect(result[0].next_review).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
