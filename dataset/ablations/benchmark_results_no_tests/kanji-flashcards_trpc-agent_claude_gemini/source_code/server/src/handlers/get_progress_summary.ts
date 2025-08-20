import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type ProgressSummary, type JlptLevel } from '../schema';
import { eq, and, count, type SQL } from 'drizzle-orm';

export async function getProgressSummary(userId: string, jlptLevel?: JlptLevel): Promise<ProgressSummary[]> {
  try {
    // Get total kanji count per level
    const totalKanjiConditions: SQL<unknown>[] = [];
    if (jlptLevel) {
      totalKanjiConditions.push(eq(kanjiTable.jlpt_level, jlptLevel));
    }

    const totalKanjiQuery = totalKanjiConditions.length > 0
      ? db
          .select({
            jlpt_level: kanjiTable.jlpt_level,
            total_kanji: count(kanjiTable.id).as('total_kanji')
          })
          .from(kanjiTable)
          .where(and(...totalKanjiConditions))
          .groupBy(kanjiTable.jlpt_level)
      : db
          .select({
            jlpt_level: kanjiTable.jlpt_level,
            total_kanji: count(kanjiTable.id).as('total_kanji')
          })
          .from(kanjiTable)
          .groupBy(kanjiTable.jlpt_level);

    const totalKanjiResults = await totalKanjiQuery.execute();

    // Get learned kanji count per level for the specific user
    const learnedKanjiConditions: SQL<unknown>[] = [
      eq(userProgressTable.user_id, userId),
      eq(userProgressTable.is_learned, true)
    ];

    if (jlptLevel) {
      learnedKanjiConditions.push(eq(kanjiTable.jlpt_level, jlptLevel));
    }

    const learnedKanjiQuery = db
      .select({
        jlpt_level: kanjiTable.jlpt_level,
        learned_kanji: count(userProgressTable.id).as('learned_kanji')
      })
      .from(kanjiTable)
      .innerJoin(userProgressTable, eq(kanjiTable.id, userProgressTable.kanji_id))
      .where(and(...learnedKanjiConditions))
      .groupBy(kanjiTable.jlpt_level);

    const learnedKanjiResults = await learnedKanjiQuery.execute();

    // Create a map of learned kanji counts by level for easy lookup
    const learnedKanjiMap = new Map<JlptLevel, number>();
    learnedKanjiResults.forEach(result => {
      learnedKanjiMap.set(result.jlpt_level, result.learned_kanji);
    });

    // Combine the results and calculate progress percentages
    const progressSummaries: ProgressSummary[] = totalKanjiResults.map(totalResult => {
      const learned = learnedKanjiMap.get(totalResult.jlpt_level) || 0;
      const total = totalResult.total_kanji;
      const progressPercentage = total > 0 ? Math.round((learned / total) * 100) : 0;

      return {
        jlpt_level: totalResult.jlpt_level,
        total_kanji: total,
        learned_kanji: learned,
        progress_percentage: progressPercentage
      };
    });

    return progressSummaries;
  } catch (error) {
    console.error('Progress summary retrieval failed:', error);
    throw error;
  }
}
