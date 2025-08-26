import { db } from '../db';
import { userProgressTable, reviewSessionsTable, kanjiTable } from '../db/schema';
import { type GetUserStatsQuery, type UserStats } from '../schema';
import { eq, and, lte, count, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getUserStats = async (query: GetUserStatsQuery): Promise<UserStats> => {
  try {
    const now = new Date();
    
    // Query for user progress data - conditionally join with kanji table for JLPT filtering
    const progressConditions: SQL<unknown>[] = [
      eq(userProgressTable.user_id, query.user_id)
    ];

    if (query.jlpt_level) {
      progressConditions.push(eq(kanjiTable.jlpt_level, query.jlpt_level));
    }

    // Build progress query with conditional join
    const progressQuery = query.jlpt_level
      ? db.select()
          .from(userProgressTable)
          .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id))
          .where(and(...progressConditions))
      : db.select()
          .from(userProgressTable)
          .where(eq(userProgressTable.user_id, query.user_id));

    const progressResults = await progressQuery.execute();

    // Calculate SRS level counts from progress data
    const srsLevelCounts = {
      apprentice: 0,
      guru: 0,
      master: 0,
      enlightened: 0,
      burned: 0,
      reviewsDue: 0
    };

    for (const result of progressResults) {
      // Handle joined vs non-joined result structure
      const progressData = query.jlpt_level 
        ? (result as any).user_progress 
        : result;

      const srsLevel = progressData.srs_level;
      const nextReviewAt = progressData.next_review_at;

      // Count SRS levels
      if (srsLevel.startsWith('APPRENTICE_')) {
        srsLevelCounts.apprentice++;
      } else if (srsLevel.startsWith('GURU_')) {
        srsLevelCounts.guru++;
      } else if (srsLevel === 'MASTER') {
        srsLevelCounts.master++;
      } else if (srsLevel === 'ENLIGHTENED') {
        srsLevelCounts.enlightened++;
      } else if (srsLevel === 'BURNED') {
        srsLevelCounts.burned++;
      }

      // Count reviews due (exclude BURNED items which don't need review)
      if (srsLevel !== 'BURNED' && nextReviewAt <= now) {
        srsLevelCounts.reviewsDue++;
      }
    }

    // Calculate accuracy percentage from review sessions
    const accuracyConditions: SQL<unknown>[] = [
      eq(reviewSessionsTable.user_id, query.user_id)
    ];

    if (query.jlpt_level) {
      accuracyConditions.push(eq(kanjiTable.jlpt_level, query.jlpt_level));
    }

    // Build accuracy query with conditional join
    const accuracyQuery = query.jlpt_level
      ? db.select({
          correct: count(sql`CASE WHEN ${reviewSessionsTable.result} = 'CORRECT' THEN 1 END`),
          total: count()
        })
        .from(reviewSessionsTable)
        .innerJoin(kanjiTable, eq(reviewSessionsTable.kanji_id, kanjiTable.id))
        .where(and(...accuracyConditions))
      : db.select({
          correct: count(sql`CASE WHEN ${reviewSessionsTable.result} = 'CORRECT' THEN 1 END`),
          total: count()
        })
        .from(reviewSessionsTable)
        .where(eq(reviewSessionsTable.user_id, query.user_id));

    const accuracyResults = await accuracyQuery.execute();
    const accuracyData = accuracyResults[0];
    
    const accuracyPercentage = accuracyData.total > 0 
      ? Math.round((accuracyData.correct / accuracyData.total) * 100)
      : 0;

    return {
      user_id: query.user_id,
      total_kanji: progressResults.length,
      apprentice_count: srsLevelCounts.apprentice,
      guru_count: srsLevelCounts.guru,
      master_count: srsLevelCounts.master,
      enlightened_count: srsLevelCounts.enlightened,
      burned_count: srsLevelCounts.burned,
      reviews_due_count: srsLevelCounts.reviewsDue,
      accuracy_percentage: accuracyPercentage
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
};
