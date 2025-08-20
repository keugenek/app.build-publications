import { db } from '../db';
import { userProgressTable, kanjiTable } from '../db/schema';
import { type UpdateUserProgressInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

// Spaced Repetition System intervals (in days)
const SRS_INTERVALS = [1, 3, 7, 14, 30, 90, 180];

const calculateNextReview = (reviewCount: number, currentDate: Date = new Date()): Date => {
  const intervalIndex = Math.min(reviewCount, SRS_INTERVALS.length - 1);
  const intervalDays = SRS_INTERVALS[intervalIndex];
  
  const nextReview = new Date(currentDate);
  nextReview.setDate(nextReview.getDate() + intervalDays);
  return nextReview;
};

export const updateUserProgress = async (input: UpdateUserProgressInput): Promise<UserProgress> => {
  try {
    // First, check if user progress record exists
    const existingProgress = await db
      .select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    if (existingProgress.length === 0) {
      throw new Error(`User progress not found for user_id: ${input.user_id}, kanji_id: ${input.kanji_id}`);
    }

    const current = existingProgress[0];
    const now = new Date();

    // Build update values
    const updateValues: any = {
      updated_at: now
    };

    // Handle is_learned update
    if (input.is_learned !== undefined) {
      updateValues.is_learned = input.is_learned;
    }

    // Handle review_count update and automatic SRS scheduling
    let newReviewCount = current.review_count;
    if (input.review_count !== undefined) {
      newReviewCount = input.review_count;
      updateValues.review_count = newReviewCount;
      updateValues.last_reviewed = now;
      
      // Calculate next_review using SRS if not explicitly provided
      if (input.next_review === undefined) {
        updateValues.next_review = calculateNextReview(newReviewCount, now);
      }
    }

    // Handle explicit last_reviewed update
    if (input.last_reviewed !== undefined) {
      updateValues.last_reviewed = input.last_reviewed;
    }

    // Handle explicit next_review update
    if (input.next_review !== undefined) {
      updateValues.next_review = input.next_review;
    }

    // Perform the update
    const result = await db
      .update(userProgressTable)
      .set(updateValues)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User progress update failed:', error);
    throw error;
  }
};
