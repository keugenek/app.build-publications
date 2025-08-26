import { db } from '../db';
import { reviewHistoryTable, kanjiTable } from '../db/schema';
import { type ReviewHistory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getReviewHistory(userId: number, limit: number = 50): Promise<ReviewHistory[]> {
  try {
    // Query review history with kanji information joined
    const results = await db.select({
      id: reviewHistoryTable.id,
      user_id: reviewHistoryTable.user_id,
      kanji_id: reviewHistoryTable.kanji_id,
      result: reviewHistoryTable.result,
      previous_srs_level: reviewHistoryTable.previous_srs_level,
      new_srs_level: reviewHistoryTable.new_srs_level,
      review_time_ms: reviewHistoryTable.review_time_ms,
      created_at: reviewHistoryTable.created_at,
    })
    .from(reviewHistoryTable)
    .innerJoin(kanjiTable, eq(reviewHistoryTable.kanji_id, kanjiTable.id))
    .where(eq(reviewHistoryTable.user_id, userId))
    .orderBy(desc(reviewHistoryTable.created_at))
    .limit(limit)
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to get review history:', error);
    throw error;
  }
}
