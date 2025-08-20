import { db } from '../db';
import { flashcardTable, kanjiTable } from '../db/schema';
import { type CreateFlashcardInput, type Flashcard } from '../schema';
import { eq } from 'drizzle-orm';

export const createFlashcard = async (input: CreateFlashcardInput): Promise<Flashcard> => {
  try {
    // First, verify that the kanji exists
    const kanjiExists = await db.select({ id: kanjiTable.id })
      .from(kanjiTable)
      .where(eq(kanjiTable.id, input.kanjiId))
      .limit(1)
      .execute();

    if (kanjiExists.length === 0) {
      throw new Error(`Kanji with id ${input.kanjiId} not found`);
    }

    // Create the flashcard with initial SRS values
    const [result] = await db.insert(flashcardTable)
      .values({
        kanjiId: input.kanjiId,
        userId: input.userId,
        nextReviewDate: new Date(), // Initial review is due immediately
        interval: 1, // 1 day interval to start
        easeFactor: '2.50', // Default ease factor as string for numeric column
        repetitionCount: 0, // Not reviewed yet
        lastReviewedAt: null // Never reviewed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    return {
      id: result.id,
      kanjiId: result.kanjiId,
      userId: result.userId,
      nextReviewDate: result.nextReviewDate,
      interval: result.interval,
      easeFactor: parseFloat(result.easeFactor), // Convert string back to number
      repetitionCount: result.repetitionCount,
      lastReviewedAt: result.lastReviewedAt,
      createdAt: result.createdAt
    };
  } catch (error) {
    console.error('Flashcard creation failed:', error);
    throw error;
  }
};
