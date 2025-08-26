import { db } from '../db';
import { userProgressTable, reviewHistoryTable } from '../db/schema';
import { type SubmitReviewInput, type UserProgress, type SRSLevel } from '../schema';
import { eq, and } from 'drizzle-orm';

// SRS level progression mapping
const SRS_PROGRESSION: Record<SRSLevel, SRSLevel> = {
  'APPRENTICE_1': 'APPRENTICE_2',
  'APPRENTICE_2': 'APPRENTICE_3', 
  'APPRENTICE_3': 'APPRENTICE_4',
  'APPRENTICE_4': 'GURU_1',
  'GURU_1': 'GURU_2',
  'GURU_2': 'MASTER',
  'MASTER': 'ENLIGHTENED',
  'ENLIGHTENED': 'BURNED',
  'BURNED': 'BURNED' // Max level stays the same
};

// SRS intervals in hours
const SRS_INTERVALS: Record<SRSLevel, number> = {
  'APPRENTICE_1': 4,
  'APPRENTICE_2': 8,
  'APPRENTICE_3': 23,
  'APPRENTICE_4': 47,
  'GURU_1': 168,      // 1 week
  'GURU_2': 336,      // 2 weeks
  'MASTER': 720,      // 1 month
  'ENLIGHTENED': 2160, // 3 months
  'BURNED': 8760      // 1 year (reviews stop after BURNED)
};

// Calculate demotion level for incorrect answers
function getDemotedLevel(currentLevel: SRSLevel): SRSLevel {
  switch (currentLevel) {
    case 'APPRENTICE_1':
    case 'APPRENTICE_2':
      return 'APPRENTICE_1';
    case 'APPRENTICE_3':
    case 'APPRENTICE_4':
      return 'APPRENTICE_2';
    case 'GURU_1':
    case 'GURU_2':
      return 'APPRENTICE_3';
    case 'MASTER':
    case 'ENLIGHTENED':
    case 'BURNED':
      return 'GURU_1';
    default:
      return 'APPRENTICE_1';
  }
}

export async function submitReview(input: SubmitReviewInput): Promise<UserProgress> {
  try {
    // 1. Find existing user progress record
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    if (existingProgress.length === 0) {
      throw new Error('No progress record found for this user-kanji pair');
    }

    const currentProgress = existingProgress[0];
    const previousSrsLevel = currentProgress.srs_level as SRSLevel;

    // 2. Calculate new SRS level and streak based on result
    let newSrsLevel: SRSLevel;
    let newCorrectStreak: number;

    if (input.result === 'CORRECT') {
      // Advance to next level
      newSrsLevel = SRS_PROGRESSION[previousSrsLevel];
      newCorrectStreak = currentProgress.correct_streak + 1;
    } else {
      // Demote level and reset streak
      newSrsLevel = getDemotedLevel(previousSrsLevel);
      newCorrectStreak = 0;
    }

    // 3. Calculate next review time based on new SRS level
    const nextReviewAt = new Date();
    nextReviewAt.setHours(nextReviewAt.getHours() + SRS_INTERVALS[newSrsLevel]);

    // 4. Create review history record
    await db.insert(reviewHistoryTable)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        result: input.result,
        previous_srs_level: previousSrsLevel,
        new_srs_level: newSrsLevel,
        review_time_ms: input.review_time_ms
      })
      .execute();

    // 5. Update user progress record
    const updatedProgress = await db.update(userProgressTable)
      .set({
        srs_level: newSrsLevel,
        next_review_at: nextReviewAt,
        correct_streak: newCorrectStreak,
        total_reviews: currentProgress.total_reviews + 1,
        updated_at: new Date()
      })
      .where(eq(userProgressTable.id, currentProgress.id))
      .returning()
      .execute();

    return updatedProgress[0];
  } catch (error) {
    console.error('Review submission failed:', error);
    throw error;
  }
}
