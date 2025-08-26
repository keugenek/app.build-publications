import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type KanjiWithProgress } from '../schema';
import { eq, and, or, isNull, lte, asc } from 'drizzle-orm';

export async function getDueReviews(userId: string): Promise<KanjiWithProgress[]> {
  try {
    const now = new Date();
    
    // Query for kanji with user progress that are due for review
    // This includes kanji where:
    // 1. next_review is null (never been reviewed or needs initial review)
    // 2. next_review is in the past (due for review)
    const results = await db.select()
      .from(kanjiTable)
      .innerJoin(userProgressTable, eq(kanjiTable.id, userProgressTable.kanji_id))
      .where(
        and(
          eq(userProgressTable.user_id, userId),
          or(
            isNull(userProgressTable.next_review),
            lte(userProgressTable.next_review, now)
          )
        )
      )
      .orderBy(
        // Priority order: null next_review first (new cards), then by next_review date
        asc(userProgressTable.next_review)
      )
      .execute();

    // Transform the joined results into KanjiWithProgress format
    return results.map(result => ({
      id: result.kanji.id,
      character: result.kanji.character,
      meaning: result.kanji.meaning,
      on_reading: result.kanji.on_reading,
      kun_reading: result.kanji.kun_reading,
      jlpt_level: result.kanji.jlpt_level,
      created_at: result.kanji.created_at,
      progress: {
        is_learned: result.user_progress.is_learned,
        review_count: result.user_progress.review_count,
        last_reviewed: result.user_progress.last_reviewed,
        next_review: result.user_progress.next_review
      }
    }));
  } catch (error) {
    console.error('Failed to get due reviews:', error);
    throw error;
  }
}
