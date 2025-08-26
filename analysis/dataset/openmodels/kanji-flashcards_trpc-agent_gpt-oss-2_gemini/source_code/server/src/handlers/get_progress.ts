import { type Progress } from '../schema';
import { db } from '../db';
import { progressTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Retrieves aggregated progress for a given user.
 * Aggregates correct/incorrect counts per kanji and provides the most recent review date.
 */
export const getProgress = async (userId: number): Promise<Progress[]> => {
  try {
    // Fetch all raw progress records for the user
    const rows = await db
      .select()
      .from(progressTable)
      .where(eq(progressTable.user_id, userId))
      .execute();

    // Aggregate counts per (user, kanji) pair
    const aggregation = new Map<string, {
      user_id: number;
      kanji_id: number;
      correct_count: number;
      incorrect_count: number;
      last_reviewed: Date;
    }>();

    for (const row of rows) {
      const key = `${row.user_id}-${row.kanji_id}`;
      const existing = aggregation.get(key);
      const reviewedAt = row.reviewed_at instanceof Date ? row.reviewed_at : new Date(row.reviewed_at as any);

      if (!existing) {
        aggregation.set(key, {
          user_id: row.user_id,
          kanji_id: row.kanji_id,
          correct_count: row.correct ? 1 : 0,
          incorrect_count: row.correct ? 0 : 1,
          last_reviewed: reviewedAt,
        });
      } else {
        existing.correct_count += row.correct ? 1 : 0;
        existing.incorrect_count += row.correct ? 0 : 1;
        if (reviewedAt > existing.last_reviewed) {
          existing.last_reviewed = reviewedAt;
        }
        aggregation.set(key, existing);
      }
    }

    // Convert map to array of Progress objects (next_review omitted)
    const result: Progress[] = Array.from(aggregation.values()).map(v => ({
      user_id: v.user_id,
      kanji_id: v.kanji_id,
      correct_count: v.correct_count,
      incorrect_count: v.incorrect_count,
      last_reviewed: v.last_reviewed,
    }));

    return result;
  } catch (error) {
    console.error('Failed to get progress:', error);
    throw error;
  }
};
