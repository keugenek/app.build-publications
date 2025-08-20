import { db } from '../db';
import { flashcardTable } from '../db/schema';
import { type Flashcard } from '../schema';
import { and, lte, eq } from 'drizzle-orm';

export const getFlashcardsForReview = async (userId: string): Promise<Flashcard[]> => {
  try {
    const now = new Date();
    
    const results = await db.select({
      id: flashcardTable.id,
      kanjiId: flashcardTable.kanjiId,
      userId: flashcardTable.userId,
      nextReviewDate: flashcardTable.nextReviewDate,
      interval: flashcardTable.interval,
      easeFactor: flashcardTable.easeFactor,
      repetitionCount: flashcardTable.repetitionCount,
      lastReviewedAt: flashcardTable.lastReviewedAt,
      createdAt: flashcardTable.createdAt,
    })
    .from(flashcardTable)
    .where(
      and(
        eq(flashcardTable.userId, userId),
        lte(flashcardTable.nextReviewDate, now)
      )
    )
    .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(flashcard => ({
      ...flashcard,
      easeFactor: parseFloat(flashcard.easeFactor)
    }));
  } catch (error) {
    console.error('Failed to fetch flashcards for review:', error);
    throw error;
  }
};
