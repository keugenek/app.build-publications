import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetProgressByLevelInput, type ProgressStats } from '../schema';
import { eq, and, lte, count } from 'drizzle-orm';

export async function getProgressByLevel(input: GetProgressByLevelInput): Promise<ProgressStats[]> {
  try {
    const levels = input.jlpt_level ? [input.jlpt_level] : ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    const now = new Date();
    const results: ProgressStats[] = [];

    for (const level of levels) {
      // Get total kanji count for this level
      const totalKanjiResult = await db
        .select({ count: count() })
        .from(kanjiTable)
        .where(eq(kanjiTable.jlpt_level, level))
        .execute();

      const totalKanji = totalKanjiResult[0]?.count || 0;

      // Get learned kanji count (kanji with user progress records for this user)
      const learnedKanjiResult = await db
        .select({ count: count() })
        .from(userProgressTable)
        .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id))
        .where(
          and(
            eq(userProgressTable.user_id, input.user_id),
            eq(kanjiTable.jlpt_level, level)
          )
        )
        .execute();

      const learnedKanji = learnedKanjiResult[0]?.count || 0;

      // Get due for review count (learned kanji where next_review_at <= now)
      const dueForReviewResult = await db
        .select({ count: count() })
        .from(userProgressTable)
        .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id))
        .where(
          and(
            eq(userProgressTable.user_id, input.user_id),
            eq(kanjiTable.jlpt_level, level),
            lte(userProgressTable.next_review_at, now)
          )
        )
        .execute();

      const dueForReview = dueForReviewResult[0]?.count || 0;

      // Calculate completion percentage
      const completionPercentage = totalKanji > 0 ? (learnedKanji / totalKanji) * 100 : 0;

      results.push({
        jlpt_level: level,
        total_kanji: totalKanji,
        learned_kanji: learnedKanji,
        due_for_review: dueForReview,
        completion_percentage: Math.round(completionPercentage * 100) / 100 // Round to 2 decimal places
      });
    }

    return results;
  } catch (error) {
    console.error('Failed to get progress by level:', error);
    throw error;
  }
}
