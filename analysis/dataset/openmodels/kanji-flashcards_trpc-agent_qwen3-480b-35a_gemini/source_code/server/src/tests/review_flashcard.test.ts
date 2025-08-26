import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { flashcardTable, kanjiTable } from '../db/schema';
import { type ReviewFlashcardInput } from '../schema';
import { reviewFlashcard } from '../handlers/review_flashcard';
import { eq } from 'drizzle-orm';

describe('reviewFlashcard', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test kanji first
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '一',
        meaning: 'one',
        kunReading: 'ひと(つ)',
        onReading: 'イチ',
        jlptLevel: 'N5'
      })
      .returning()
      .execute();
    
    const kanjiId = kanjiResult[0].id;
    
    // Create a test flashcard
    await db.insert(flashcardTable)
      .values({
        kanjiId: kanjiId,
        userId: 'user123',
        nextReviewDate: new Date(),
        interval: 0,
        easeFactor: '2.5', // Store as string as per schema
        repetitionCount: 0,
        lastReviewedAt: null
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update flashcard based on review quality', async () => {
    // First get the flashcard ID
    const flashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.userId, 'user123'))
      .execute();
      
    const flashcardId = flashcards[0].id;
    
    const input: ReviewFlashcardInput = {
      flashcardId: flashcardId,
      quality: 4
    };

    const result = await reviewFlashcard(input);

    // Basic field validation
    expect(result.id).toEqual(flashcardId);
    expect(result.kanjiId).toBeDefined();
    expect(result.userId).toEqual('user123');
    expect(result.interval).toBeGreaterThan(0);
    expect(result.repetitionCount).toBeGreaterThan(0);
    expect(result.lastReviewedAt).toBeInstanceOf(Date);
    expect(typeof result.easeFactor).toBe('number');
  });

  it('should save updated flashcard to database', async () => {
    // First get the flashcard ID
    const flashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.userId, 'user123'))
      .execute();
      
    const flashcardId = flashcards[0].id;
    
    const input: ReviewFlashcardInput = {
      flashcardId: flashcardId,
      quality: 3
    };

    await reviewFlashcard(input);

    // Query the updated flashcard
    const updatedFlashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.id, flashcardId))
      .execute();

    expect(updatedFlashcards).toHaveLength(1);
    const updatedFlashcard = updatedFlashcards[0];
    expect(updatedFlashcard.interval).toBeGreaterThan(0);
    expect(updatedFlashcard.repetitionCount).toBeGreaterThan(0);
    expect(updatedFlashcard.lastReviewedAt).toBeInstanceOf(Date);
    expect(parseFloat(updatedFlashcard.easeFactor)).toBeGreaterThan(0);
  });

  it('should handle poor recall quality (0-2)', async () => {
    // First get the flashcard ID
    const flashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.userId, 'user123'))
      .execute();
      
    const flashcardId = flashcards[0].id;
    
    const input: ReviewFlashcardInput = {
      flashcardId: flashcardId,
      quality: 2 // Poor quality
    };

    const result = await reviewFlashcard(input);

    // With poor quality, repetition count should reset to 0
    expect(result.repetitionCount).toBe(0);
    // Interval should be 1
    expect(result.interval).toBe(1);
  });

  it('should handle good recall quality (3-5)', async () => {
    // First get the flashcard ID
    const flashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.userId, 'user123'))
      .execute();
      
    const flashcardId = flashcards[0].id;
    
    const input: ReviewFlashcardInput = {
      flashcardId: flashcardId,
      quality: 5 // Excellent quality
    };

    const result = await reviewFlashcard(input);

    // With good quality, repetition count should increment to 1 (0 + 1)
    expect(result.repetitionCount).toBe(1);
    // Interval should be 1 for first repetition
    expect(result.interval).toBe(1);
    // Ease factor should be adjusted based on quality
    expect(result.easeFactor).toBeGreaterThan(2.0);
  });

  it('should throw error for non-existent flashcard', async () => {
    const input: ReviewFlashcardInput = {
      flashcardId: 99999, // Non-existent ID
      quality: 4
    };

    await expect(reviewFlashcard(input)).rejects.toThrow(/not found/);
  });
});
