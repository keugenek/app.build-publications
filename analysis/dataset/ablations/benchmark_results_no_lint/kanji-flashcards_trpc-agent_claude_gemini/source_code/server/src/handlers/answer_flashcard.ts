import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type AnswerFlashcardInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const answerFlashcard = async (input: AnswerFlashcardInput): Promise<UserProgress> => {
  try {
    // Check if user progress already exists
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    const now = new Date();
    let updatedProgress: UserProgress;

    if (existingProgress.length > 0) {
      // Update existing progress
      const current = existingProgress[0];
      
      let newInterval: number;
      let newEaseFactor: number;
      let correctCount = current.correct_count;
      let incorrectCount = current.incorrect_count;

      if (input.is_correct) {
        // Correct answer: increase interval and count
        correctCount += 1;
        newInterval = Math.round(current.current_interval * current.ease_factor);
        newEaseFactor = current.ease_factor; // Keep ease factor same on correct
      } else {
        // Incorrect answer: reset interval, decrease ease factor
        incorrectCount += 1;
        newInterval = 1; // Reset to 1 day
        newEaseFactor = Math.max(1.3, current.ease_factor - 0.2); // Minimum 1.3
      }

      // Calculate next review date
      const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

      // Update the record
      const result = await db.update(userProgressTable)
        .set({
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          current_interval: newInterval,
          ease_factor: newEaseFactor, // Real type - no conversion needed
          next_review_date: nextReviewDate,
          last_reviewed_at: now
        })
        .where(
          and(
            eq(userProgressTable.user_id, input.user_id),
            eq(userProgressTable.kanji_id, input.kanji_id)
          )
        )
        .returning()
        .execute();

      updatedProgress = result[0];
    } else {
      // Create new progress record
      let initialInterval: number;
      let initialEaseFactor: number;
      let correctCount: number;
      let incorrectCount: number;

      if (input.is_correct) {
        initialInterval = 4; // First correct answer gets 4 days
        initialEaseFactor = 2.5;
        correctCount = 1;
        incorrectCount = 0;
      } else {
        initialInterval = 1; // First incorrect answer gets 1 day
        initialEaseFactor = 2.3; // Slightly reduced from default 2.5
        correctCount = 0;
        incorrectCount = 1;
      }

      const nextReviewDate = new Date(now.getTime() + initialInterval * 24 * 60 * 60 * 1000);

      const result = await db.insert(userProgressTable)
        .values({
          user_id: input.user_id,
          kanji_id: input.kanji_id,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          current_interval: initialInterval,
          ease_factor: initialEaseFactor, // Real type - no conversion needed
          next_review_date: nextReviewDate,
          last_reviewed_at: now
        })
        .returning()
        .execute();

      updatedProgress = result[0];
    }

    return updatedProgress;
  } catch (error) {
    console.error('Flashcard answer processing failed:', error);
    throw error;
  }
};
