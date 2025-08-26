import { db } from '../db';
import { flashcardTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ReviewFlashcardInput, type Flashcard } from '../schema';

export const reviewFlashcard = async (input: ReviewFlashcardInput): Promise<Flashcard> => {
  try {
    // First, get the current flashcard data
    const currentFlashcards = await db.select()
      .from(flashcardTable)
      .where(eq(flashcardTable.id, input.flashcardId))
      .execute();

    if (currentFlashcards.length === 0) {
      throw new Error(`Flashcard with id ${input.flashcardId} not found`);
    }

    const currentFlashcard = currentFlashcards[0];

    // Implement the SRS algorithm (simplified version of SM-2)
    let { interval, repetitionCount } = currentFlashcard;
    
    // Convert easeFactor from string to number for calculations
    let numericEaseFactor = parseFloat(currentFlashcard.easeFactor);
    
    // Update the flashcard based on the quality of recall (0-5)
    if (input.quality < 3) {
      // If quality is poor (0-2), reset the repetition count
      repetitionCount = 0;
      interval = 1;
    } else {
      // If quality is good (3-5), increase the repetition count
      repetitionCount += 1;
      
      if (repetitionCount === 1) {
        interval = 1;
      } else if (repetitionCount === 2) {
        interval = 6;
      } else {
        // For subsequent repetitions, multiply by the ease factor
        interval = Math.round(interval * numericEaseFactor);
      }
    }
    
    // Adjust ease factor based on recall quality
    numericEaseFactor = numericEaseFactor + (0.1 - (5 - input.quality) * (0.08 + (5 - input.quality) * 0.02));
    
    // Ensure ease factor doesn't fall below 1.3
    if (numericEaseFactor < 1.3) {
      numericEaseFactor = 1.3;
    }
    
    // Calculate next review date (current date + interval days)
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    // Update the flashcard in the database
    const result = await db.update(flashcardTable)
      .set({
        nextReviewDate: nextReviewDate,
        interval: interval,
        easeFactor: numericEaseFactor.toString(), // Convert back to string for storage
        repetitionCount: repetitionCount,
        lastReviewedAt: new Date()
      })
      .where(eq(flashcardTable.id, input.flashcardId))
      .returning()
      .execute();

    // Convert the result back to the expected format
    const updatedFlashcard = result[0];
    return {
      id: updatedFlashcard.id,
      kanjiId: updatedFlashcard.kanjiId,
      userId: updatedFlashcard.userId,
      nextReviewDate: updatedFlashcard.nextReviewDate,
      interval: updatedFlashcard.interval,
      easeFactor: parseFloat(updatedFlashcard.easeFactor), // Convert string back to number
      repetitionCount: updatedFlashcard.repetitionCount,
      lastReviewedAt: updatedFlashcard.lastReviewedAt,
      createdAt: updatedFlashcard.createdAt
    };
  } catch (error) {
    console.error('Flashcard review failed:', error);
    throw error;
  }
};
