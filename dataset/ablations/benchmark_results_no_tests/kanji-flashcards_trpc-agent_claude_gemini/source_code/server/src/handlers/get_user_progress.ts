import { db } from '../db';
import { userProgressTable, kanjiTable } from '../db/schema';
import { type GetUserProgressByLevelInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getUserProgress(input: GetUserProgressByLevelInput): Promise<UserProgress[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(userProgressTable.user_id, input.user_id));

    if (input.jlpt_level) {
      // When filtering by JLPT level, we need to join with kanji table
      conditions.push(eq(kanjiTable.jlpt_level, input.jlpt_level));

      const joinedQuery = db.select()
        .from(userProgressTable)
        .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id))
        .where(and(...conditions));

      const results = await joinedQuery.execute();

      // Handle joined results - data is nested
      return results.map(result => {
        const progressData = (result as any).user_progress;
        return {
          ...progressData,
          // Convert dates properly
          created_at: new Date(progressData.created_at),
          updated_at: new Date(progressData.updated_at),
          last_reviewed: progressData.last_reviewed ? new Date(progressData.last_reviewed) : null,
          next_review: progressData.next_review ? new Date(progressData.next_review) : null
        };
      });
    } else {
      // When not filtering by level, query just the progress table
      const query = db.select()
        .from(userProgressTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));

      const results = await query.execute();

      return results.map(result => ({
        ...result,
        // Convert dates properly
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at),
        last_reviewed: result.last_reviewed ? new Date(result.last_reviewed) : null,
        next_review: result.next_review ? new Date(result.next_review) : null
      }));
    }
  } catch (error) {
    console.error('Get user progress failed:', error);
    throw error;
  }
}
