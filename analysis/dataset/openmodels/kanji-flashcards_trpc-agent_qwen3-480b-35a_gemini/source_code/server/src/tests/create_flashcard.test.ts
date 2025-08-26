import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { flashcardTable, kanjiTable } from '../db/schema';
import { type CreateFlashcardInput } from '../schema';
import { createFlashcard } from '../handlers/create_flashcard';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateFlashcardInput = {
  kanjiId: 1,
  userId: 'user-123'
};

// Test kanji data for prerequisite
const testKanji = {
  character: '一',
  meaning: 'one',
  kunReading: 'ひと',
  onReading: 'ichi',
  jlptLevel: 'N5' as const
};

describe('createFlashcard', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a kanji record first as a prerequisite
    await db.insert(kanjiTable).values(testKanji).execute();
  });
  
  afterEach(resetDB);

  it('should create a flashcard with correct initial SRS values', async () => {
    const result = await createFlashcard(testInput);

    // Basic field validation
    expect(result.kanjiId).toEqual(1);
    expect(result.userId).toEqual('user-123');
    expect(result.interval).toEqual(1);
    expect(result.easeFactor).toEqual(2.5);
    expect(result.repetitionCount).toEqual(0);
    expect(result.lastReviewedAt).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.nextReviewDate).toBeInstanceOf(Date);
  });

  it('should save flashcard to database', async () => {
    const result = await createFlashcard(testInput);

    // Query using proper drizzle syntax
    const flashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.id, result.id))
      .execute();

    expect(flashcards).toHaveLength(1);
    expect(flashcards[0].kanjiId).toEqual(1);
    expect(flashcards[0].userId).toEqual('user-123');
    expect(flashcards[0].interval).toEqual(1);
    expect(parseFloat(flashcards[0].easeFactor)).toBeCloseTo(2.5);
    expect(flashcards[0].repetitionCount).toEqual(0);
    expect(flashcards[0].lastReviewedAt).toBeNull();
    expect(flashcards[0].createdAt).toBeInstanceOf(Date);
  });

  it('should throw an error when kanji does not exist', async () => {
    const invalidInput: CreateFlashcardInput = {
      kanjiId: 999, // Non-existent kanji ID
      userId: 'user-123'
    };

    await expect(createFlashcard(invalidInput)).rejects.toThrow(/not found/);
  });
});
