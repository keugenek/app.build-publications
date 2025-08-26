import { db } from '../db';
import { userProgressTable, reviewSessionsTable } from '../db/schema';
import { type SubmitReviewInput, type UserProgress, type SRSLevel } from '../schema';
import { eq, and } from 'drizzle-orm';

// SRS level advancement mapping
const SRS_ADVANCEMENT: Record<SRSLevel, SRSLevel> = {
  'APPRENTICE_1': 'APPRENTICE_2',
  'APPRENTICE_2': 'APPRENTICE_3',
  'APPRENTICE_3': 'APPRENTICE_4',
  'APPRENTICE_4': 'GURU_1',
  'GURU_1': 'GURU_2',
  'GURU_2': 'MASTER',
  'MASTER': 'ENLIGHTENED',
  'ENLIGHTENED': 'BURNED',
  'BURNED': 'BURNED' // Cannot advance further
};

// SRS level demotion mapping (when answer is incorrect)
const SRS_DEMOTION: Record<SRSLevel, SRSLevel> = {
  'APPRENTICE_1': 'APPRENTICE_1', // Cannot demote further
  'APPRENTICE_2': 'APPRENTICE_1',
  'APPRENTICE_3': 'APPRENTICE_1',
  'APPRENTICE_4': 'APPRENTICE_1',
  'GURU_1': 'APPRENTICE_4',
  'GURU_2': 'APPRENTICE_4',
  'MASTER': 'APPRENTICE_4',
  'ENLIGHTENED': 'APPRENTICE_4',
  'BURNED': 'APPRENTICE_4'
};

// SRS interval mappings in milliseconds
const SRS_INTERVALS: Record<SRSLevel, number> = {
  'APPRENTICE_1': 4 * 60 * 60 * 1000, // 4 hours
  'APPRENTICE_2': 8 * 60 * 60 * 1000, // 8 hours  
  'APPRENTICE_3': 24 * 60 * 60 * 1000, // 1 day
  'APPRENTICE_4': 2 * 24 * 60 * 60 * 1000, // 2 days
  'GURU_1': 7 * 24 * 60 * 60 * 1000, // 1 week
  'GURU_2': 14 * 24 * 60 * 60 * 1000, // 2 weeks
  'MASTER': 30 * 24 * 60 * 60 * 1000, // 1 month
  'ENLIGHTENED': 120 * 24 * 60 * 60 * 1000, // 4 months
  'BURNED': 365 * 24 * 60 * 60 * 1000 // Set far in the future (1 year) as never review
};

const calculateNextReviewDate = (srsLevel: SRSLevel): Date => {
  const interval = SRS_INTERVALS[srsLevel];
  return new Date(Date.now() + interval);
};

export const submitReview = async (input: SubmitReviewInput): Promise<UserProgress> => {
  try {
    // First, get the current user progress
    const currentProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    if (currentProgress.length === 0) {
      throw new Error('User progress not found for this kanji');
    }

    const progress = currentProgress[0];
    const previousSrsLevel = progress.srs_level as SRSLevel;
    const now = new Date();

    // Calculate new progress values based on review result
    let newSrsLevel: SRSLevel;
    let newCorrectStreak: number;
    let newIncorrectCount: number;

    if (input.result === 'CORRECT') {
      newCorrectStreak = progress.correct_streak + 1;
      newIncorrectCount = progress.incorrect_count;
      
      // Advance SRS level based on streak requirements
      if (shouldAdvanceSrsLevel(previousSrsLevel, newCorrectStreak)) {
        newSrsLevel = SRS_ADVANCEMENT[previousSrsLevel];
        // Reset streak after advancement (each level requires fresh correct answers)
        newCorrectStreak = 0;
      } else {
        newSrsLevel = previousSrsLevel;
      }
    } else {
      // Incorrect answer
      newCorrectStreak = 0;
      newIncorrectCount = progress.incorrect_count + 1;
      newSrsLevel = SRS_DEMOTION[previousSrsLevel];
    }

    const nextReviewAt = calculateNextReviewDate(newSrsLevel);

    // Record the review session
    await db.insert(reviewSessionsTable)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        result: input.result,
        response_time_ms: input.response_time_ms,
        previous_srs_level: previousSrsLevel,
        new_srs_level: newSrsLevel
      })
      .execute();

    // Update user progress
    const updatedProgress = await db.update(userProgressTable)
      .set({
        srs_level: newSrsLevel,
        next_review_at: nextReviewAt,
        correct_streak: newCorrectStreak,
        incorrect_count: newIncorrectCount,
        last_reviewed_at: now,
        updated_at: now
      })
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .returning()
      .execute();

    return updatedProgress[0];
  } catch (error) {
    console.error('Review submission failed:', error);
    throw error;
  }
};

// Helper function to determine if SRS level should advance based on correct streak
const shouldAdvanceSrsLevel = (currentLevel: SRSLevel, correctStreak: number): boolean => {
  // Define advancement requirements for each level
  const advancementRequirements: Record<SRSLevel, number> = {
    'APPRENTICE_1': 1, // Advance after 1 correct answer
    'APPRENTICE_2': 1, // Advance after 1 correct answer  
    'APPRENTICE_3': 1, // Advance after 1 correct answer
    'APPRENTICE_4': 1, // Advance after 1 correct answer
    'GURU_1': 1, // Advance after 1 correct answer
    'GURU_2': 1, // Advance after 1 correct answer
    'MASTER': 1, // Advance after 1 correct answer
    'ENLIGHTENED': 1, // Advance after 1 correct answer
    'BURNED': 999 // Cannot advance further
  };

  return correctStreak >= advancementRequirements[currentLevel];
};
