import { db } from '../db';
import { userProgressTable, kanjiTable } from '../db/schema';
import { type UserProgress, type JLPTLevel } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getUserProgress = async (userId: string, jlptLevel?: JLPTLevel): Promise<UserProgress[]> => {
  try {
    // Build the base query with join to include kanji information
    let query = db.select({
      id: userProgressTable.id,
      user_id: userProgressTable.user_id,
      kanji_id: userProgressTable.kanji_id,
      srs_level: userProgressTable.srs_level,
      next_review_at: userProgressTable.next_review_at,
      correct_streak: userProgressTable.correct_streak,
      incorrect_count: userProgressTable.incorrect_count,
      last_reviewed_at: userProgressTable.last_reviewed_at,
      created_at: userProgressTable.created_at,
      updated_at: userProgressTable.updated_at
    })
    .from(userProgressTable)
    .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id));

    // Build conditions array
    const conditions: SQL<unknown>[] = [eq(userProgressTable.user_id, userId)];

    // Add JLPT level filter if specified
    if (jlptLevel) {
      conditions.push(eq(kanjiTable.jlpt_level, jlptLevel));
    }

    // Apply where clause with proper condition handling
    const finalQuery = query
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(userProgressTable.created_at);

    const results = await finalQuery.execute();

    // Transform results to match UserProgress schema
    // Note: The joined results include extra kanji fields, but we return only UserProgress fields
    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      kanji_id: result.kanji_id,
      srs_level: result.srs_level,
      next_review_at: result.next_review_at,
      correct_streak: result.correct_streak,
      incorrect_count: result.incorrect_count,
      last_reviewed_at: result.last_reviewed_at,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to get user progress:', error);
    throw error;
  }
};
