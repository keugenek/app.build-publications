import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { flashcardTable, kanjiTable } from '../db/schema';
import { type CreateKanjiInput, type CreateFlashcardInput } from '../schema';
import { getFlashcardsForReview } from '../handlers/get_flashcards_for_review';
import { eq } from 'drizzle-orm';

// Test data
const testKanjiInput: CreateKanjiInput = {
  character: '水',
  meaning: 'water',
  kunReading: 'みず',
  onReading: 'スイ',
  jlptLevel: 'N5'
};

const userId = 'test-user-123';

describe('getFlashcardsForReview', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a kanji first as flashcard references it
    const [kanji] = await db.insert(kanjiTable)
      .values(testKanjiInput)
      .returning()
      .execute();
    
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 1);
    
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 1);
    
    // Insert test flashcards
    await db.insert(flashcardTable).values([
      {
        kanjiId: kanji.id,
        userId,
        nextReviewDate: pastDate, // Due for review
        interval: 1,
        easeFactor: '2.50',
        repetitionCount: 1,
        createdAt: now
      },
      {
        kanjiId: kanji.id,
        userId,
        nextReviewDate: futureDate, // Not due yet
        interval: 2,
        easeFactor: '2.60',
        repetitionCount: 2,
        createdAt: now
      },
      {
        kanjiId: kanji.id,
        userId: 'other-user',
        nextReviewDate: pastDate, // Due for review but different user
        interval: 1,
        easeFactor: '2.40',
        repetitionCount: 1,
        createdAt: now
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch only flashcards due for review for the specified user', async () => {
    const results = await getFlashcardsForReview(userId);
    
    // Should only return 1 flashcard (the one due for review for this user)
    expect(results).toHaveLength(1);
    
    const flashcard = results[0];
    
    // Check all fields are properly returned
    expect(flashcard.userId).toEqual(userId);
    expect(flashcard.kanjiId).toBeDefined();
    expect(flashcard.nextReviewDate).toBeInstanceOf(Date);
    expect(flashcard.interval).toEqual(1);
    expect(flashcard.easeFactor).toEqual(2.5);
    expect(flashcard.repetitionCount).toEqual(1);
    expect(flashcard.createdAt).toBeInstanceOf(Date);
    expect(flashcard.lastReviewedAt).toBeNull();
  });

  it('should return empty array when no flashcards are due for review', async () => {
    // Create another user with no due flashcards
    const otherUserId = 'other-user-no-due-cards';
    
    const results = await getFlashcardsForReview(otherUserId);
    
    expect(results).toHaveLength(0);
  });

  it('should handle the case when user has no flashcards', async () => {
    const nonExistentUserId = 'non-existent-user';
    
    const results = await getFlashcardsForReview(nonExistentUserId);
    
    expect(results).toHaveLength(0);
  });

  it('should properly convert numeric fields', async () => {
    const results = await getFlashcardsForReview(userId);
    
    expect(results).toHaveLength(1);
    
    const flashcard = results[0];
    
    // Check that numeric fields are properly converted
    expect(typeof flashcard.interval).toBe('number');
    expect(typeof flashcard.easeFactor).toBe('number');
    expect(typeof flashcard.repetitionCount).toBe('number');
  });
});
