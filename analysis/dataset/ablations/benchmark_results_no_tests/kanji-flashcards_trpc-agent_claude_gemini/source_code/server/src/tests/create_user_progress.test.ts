import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProgressTable, kanjiTable } from '../db/schema';
import { type CreateUserProgressInput } from '../schema';
import { createUserProgress } from '../handlers/create_user_progress';
import { eq, and } from 'drizzle-orm';

// Test kanji data
const testKanji = {
  character: '水',
  meaning: 'water',
  on_reading: 'スイ',
  kun_reading: 'みず',
  jlpt_level: 'N5' as const
};

// Simple test input
const testInput: CreateUserProgressInput = {
  user_id: 'user123',
  kanji_id: 1,
  is_learned: false,
  review_count: 0,
  last_reviewed: null,
  next_review: null
};

describe('createUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create user progress with all fields', async () => {
    // Create prerequisite kanji first
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    const result = await createUserProgress(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user123');
    expect(result.kanji_id).toEqual(1);
    expect(result.is_learned).toEqual(false);
    expect(result.review_count).toEqual(0);
    expect(result.last_reviewed).toBeNull();
    expect(result.next_review).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create user progress with default values', async () => {
    // Create prerequisite kanji first
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    // Test with minimal input (using Zod defaults)
    const minimalInput: CreateUserProgressInput = {
      user_id: 'user456',
      kanji_id: 1,
      is_learned: false, // Include default values for TypeScript
      review_count: 0
    };

    const result = await createUserProgress(minimalInput);

    expect(result.user_id).toEqual('user456');
    expect(result.kanji_id).toEqual(1);
    expect(result.is_learned).toEqual(false); // Default from Zod
    expect(result.review_count).toEqual(0); // Default from Zod
    expect(result.last_reviewed).toBeNull();
    expect(result.next_review).toBeNull();
  });

  it('should create user progress with custom values', async () => {
    // Create prerequisite kanji first
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    const customDate = new Date('2024-01-15');
    const futureDate = new Date('2024-01-20');
    
    const customInput: CreateUserProgressInput = {
      user_id: 'user789',
      kanji_id: 1,
      is_learned: true,
      review_count: 5,
      last_reviewed: customDate,
      next_review: futureDate
    };

    const result = await createUserProgress(customInput);

    expect(result.user_id).toEqual('user789');
    expect(result.kanji_id).toEqual(1);
    expect(result.is_learned).toEqual(true);
    expect(result.review_count).toEqual(5);
    expect(result.last_reviewed).toEqual(customDate);
    expect(result.next_review).toEqual(futureDate);
  });

  it('should save user progress to database', async () => {
    // Create prerequisite kanji first
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    const result = await createUserProgress(testInput);

    // Query using proper drizzle syntax
    const userProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.id, result.id))
      .execute();

    expect(userProgress).toHaveLength(1);
    expect(userProgress[0].user_id).toEqual('user123');
    expect(userProgress[0].kanji_id).toEqual(1);
    expect(userProgress[0].is_learned).toEqual(false);
    expect(userProgress[0].review_count).toEqual(0);
    expect(userProgress[0].created_at).toBeInstanceOf(Date);
    expect(userProgress[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when kanji does not exist', async () => {
    const invalidInput: CreateUserProgressInput = {
      user_id: 'user123',
      kanji_id: 999, // Non-existent kanji ID
      is_learned: false,
      review_count: 0
    };

    await expect(createUserProgress(invalidInput))
      .rejects
      .toThrow(/kanji with id 999 does not exist/i);
  });

  it('should throw error when progress already exists for user and kanji', async () => {
    // Create prerequisite kanji first
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    // Create initial progress
    await createUserProgress(testInput);

    // Attempt to create duplicate progress
    const duplicateInput: CreateUserProgressInput = {
      user_id: 'user123',
      kanji_id: 1,
      is_learned: false,
      review_count: 0
    };

    await expect(createUserProgress(duplicateInput))
      .rejects
      .toThrow(/progress already exists for user user123 and kanji 1/i);
  });

  it('should allow different users to have progress for same kanji', async () => {
    // Create prerequisite kanji first
    await db.insert(kanjiTable)
      .values(testKanji)
      .execute();

    // Create progress for first user
    const user1Input: CreateUserProgressInput = {
      user_id: 'user123',
      kanji_id: 1,
      is_learned: false,
      review_count: 0
    };

    const result1 = await createUserProgress(user1Input);

    // Create progress for second user with same kanji
    const user2Input: CreateUserProgressInput = {
      user_id: 'user456',
      kanji_id: 1,
      is_learned: false,
      review_count: 0
    };

    const result2 = await createUserProgress(user2Input);

    expect(result1.user_id).toEqual('user123');
    expect(result2.user_id).toEqual('user456');
    expect(result1.kanji_id).toEqual(1);
    expect(result2.kanji_id).toEqual(1);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both records exist in database
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.kanji_id, 1))
      .execute();

    expect(allProgress).toHaveLength(2);
  });

  it('should allow same user to have progress for different kanji', async () => {
    // Create two different kanji
    const kanji1Result = await db.insert(kanjiTable)
      .values(testKanji)
      .returning()
      .execute();

    const kanji2 = {
      character: '火',
      meaning: 'fire',
      on_reading: 'カ',
      kun_reading: 'ひ',
      jlpt_level: 'N5' as const
    };

    const kanji2Result = await db.insert(kanjiTable)
      .values(kanji2)
      .returning()
      .execute();

    // Create progress for first kanji
    const progress1Input: CreateUserProgressInput = {
      user_id: 'user123',
      kanji_id: kanji1Result[0].id,
      is_learned: false,
      review_count: 0
    };

    const result1 = await createUserProgress(progress1Input);

    // Create progress for second kanji with same user
    const progress2Input: CreateUserProgressInput = {
      user_id: 'user123',
      kanji_id: kanji2Result[0].id,
      is_learned: false,
      review_count: 0
    };

    const result2 = await createUserProgress(progress2Input);

    expect(result1.user_id).toEqual('user123');
    expect(result2.user_id).toEqual('user123');
    expect(result1.kanji_id).toEqual(kanji1Result[0].id);
    expect(result2.kanji_id).toEqual(kanji2Result[0].id);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both records exist in database
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.user_id, 'user123'))
      .execute();

    expect(allProgress).toHaveLength(2);
  });
});
