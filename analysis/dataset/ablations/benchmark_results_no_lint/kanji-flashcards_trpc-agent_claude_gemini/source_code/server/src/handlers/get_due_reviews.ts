import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetDueReviewsInput, type KanjiWithProgress } from '../schema';
import { eq, and, lte, or, isNull, asc, SQL } from 'drizzle-orm';

export async function getDueReviews(input: GetDueReviewsInput): Promise<KanjiWithProgress[]> {
  try {
    const now = new Date();
    
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Include kanji that are due for review OR new kanji (no progress record)
    conditions.push(
      or(
        // Due for review: has progress and next_review_date <= now
        and(
          eq(userProgressTable.user_id, input.user_id),
          lte(userProgressTable.next_review_date, now)
        ),
        // New kanji: no progress record for this user
        isNull(userProgressTable.user_id)
      )!
    );

    // Filter by JLPT level if specified
    if (input.jlpt_level) {
      conditions.push(eq(kanjiTable.jlpt_level, input.jlpt_level));
    }

    // Build complete query with all clauses
    const results = await db.select({
      id: kanjiTable.id,
      character: kanjiTable.character,
      meaning: kanjiTable.meaning,
      kun_reading: kanjiTable.kun_reading,
      on_reading: kanjiTable.on_reading,
      romaji: kanjiTable.romaji,
      jlpt_level: kanjiTable.jlpt_level,
      created_at: kanjiTable.created_at,
      // Progress fields (may be null for new kanji)
      progress_id: userProgressTable.id,
      progress_user_id: userProgressTable.user_id,
      progress_kanji_id: userProgressTable.kanji_id,
      progress_correct_count: userProgressTable.correct_count,
      progress_incorrect_count: userProgressTable.incorrect_count,
      progress_current_interval: userProgressTable.current_interval,
      progress_ease_factor: userProgressTable.ease_factor,
      progress_next_review_date: userProgressTable.next_review_date,
      progress_last_reviewed_at: userProgressTable.last_reviewed_at,
      progress_created_at: userProgressTable.created_at,
    })
    .from(kanjiTable)
    .leftJoin(
      userProgressTable,
      and(
        eq(userProgressTable.kanji_id, kanjiTable.id),
        eq(userProgressTable.user_id, input.user_id)
      )
    )
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .orderBy(asc(userProgressTable.next_review_date))
    .limit(input.limit)
    .execute();

    // Transform results to match KanjiWithProgress schema
    return results.map(result => ({
      id: result.id,
      character: result.character,
      meaning: result.meaning,
      kun_reading: result.kun_reading,
      on_reading: result.on_reading,
      romaji: result.romaji,
      jlpt_level: result.jlpt_level,
      created_at: result.created_at,
      progress: result.progress_id ? {
        id: result.progress_id,
        user_id: result.progress_user_id!,
        kanji_id: result.progress_kanji_id!,
        correct_count: result.progress_correct_count!,
        incorrect_count: result.progress_incorrect_count!,
        current_interval: result.progress_current_interval!,
        ease_factor: parseFloat(result.progress_ease_factor!.toString()), // Convert real to number
        next_review_date: result.progress_next_review_date!,
        last_reviewed_at: result.progress_last_reviewed_at,
        created_at: result.progress_created_at!,
      } : null
    }));
  } catch (error) {
    console.error('Get due reviews failed:', error);
    throw error;
  }
}

export async function getUserProgress(userId: string): Promise<KanjiWithProgress[]> {
  try {
    // Query all kanji with user progress for analytics/dashboard
    const results = await db.select({
      id: kanjiTable.id,
      character: kanjiTable.character,
      meaning: kanjiTable.meaning,
      kun_reading: kanjiTable.kun_reading,
      on_reading: kanjiTable.on_reading,
      romaji: kanjiTable.romaji,
      jlpt_level: kanjiTable.jlpt_level,
      created_at: kanjiTable.created_at,
      // Progress fields
      progress_id: userProgressTable.id,
      progress_user_id: userProgressTable.user_id,
      progress_kanji_id: userProgressTable.kanji_id,
      progress_correct_count: userProgressTable.correct_count,
      progress_incorrect_count: userProgressTable.incorrect_count,
      progress_current_interval: userProgressTable.current_interval,
      progress_ease_factor: userProgressTable.ease_factor,
      progress_next_review_date: userProgressTable.next_review_date,
      progress_last_reviewed_at: userProgressTable.last_reviewed_at,
      progress_created_at: userProgressTable.created_at,
    })
    .from(kanjiTable)
    .innerJoin(
      userProgressTable,
      and(
        eq(userProgressTable.kanji_id, kanjiTable.id),
        eq(userProgressTable.user_id, userId)
      )
    )
    .orderBy(asc(kanjiTable.jlpt_level), asc(kanjiTable.character))
    .execute();

    // Transform results to match KanjiWithProgress schema
    return results.map(result => ({
      id: result.id,
      character: result.character,
      meaning: result.meaning,
      kun_reading: result.kun_reading,
      on_reading: result.on_reading,
      romaji: result.romaji,
      jlpt_level: result.jlpt_level,
      created_at: result.created_at,
      progress: {
        id: result.progress_id,
        user_id: result.progress_user_id,
        kanji_id: result.progress_kanji_id,
        correct_count: result.progress_correct_count,
        incorrect_count: result.progress_incorrect_count,
        current_interval: result.progress_current_interval,
        ease_factor: parseFloat(result.progress_ease_factor.toString()), // Convert real to number
        next_review_date: result.progress_next_review_date,
        last_reviewed_at: result.progress_last_reviewed_at,
        created_at: result.progress_created_at,
      }
    }));
  } catch (error) {
    console.error('Get user progress failed:', error);
    throw error;
  }
}
