import { type RecordAnswerInput, type Progress } from '../schema';
import { db } from '../db';
import { progressTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Record answer handler implementation.
 * Inserts a new progress record and returns aggregated progress for the user and kanji.
 */
export const recordAnswer = async (input: RecordAnswerInput): Promise<Progress> => {
  try {
    // Insert the answer record
    await db.insert(progressTable).values({
      user_id: input.user_id,
      kanji_id: input.kanji_id,
      correct: input.correct,
    }).execute();

    // Fetch all progress rows for this user and kanji
    const rows = await db
      .select()
      .from(progressTable)
      .where(
        and(
          eq(progressTable.user_id, input.user_id),
          eq(progressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    // Aggregate counts and last reviewed date
    const correctCount = rows.filter((r) => r.correct).length;
    const incorrectCount = rows.filter((r) => !r.correct).length;
    const lastReviewed = rows.reduce((latest, r) => {
      const date = r.reviewed_at as Date;
      return latest > date ? latest : date;
    }, rows[0]?.reviewed_at as Date || new Date());

    return {
      user_id: input.user_id,
      kanji_id: input.kanji_id,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      last_reviewed: lastReviewed,
      next_review: undefined,
    } as Progress;
  } catch (error) {
    console.error('recordAnswer failed:', error);
    throw error;
  }
};
