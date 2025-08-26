import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetReviewsDueQuery, type Kanji } from '../schema';
import { eq, and, lte, ne, asc } from 'drizzle-orm';

export const getReviewsDue = async (query: GetReviewsDueQuery): Promise<Kanji[]> => {
  try {
    const currentTime = new Date();
    
    // Join user_progress with kanji table to get kanji due for review
    const results = await db.select({
      id: kanjiTable.id,
      character: kanjiTable.character,
      meaning: kanjiTable.meaning,
      kun_reading: kanjiTable.kun_reading,
      on_reading: kanjiTable.on_reading,
      jlpt_level: kanjiTable.jlpt_level,
      stroke_count: kanjiTable.stroke_count,
      created_at: kanjiTable.created_at
    })
    .from(userProgressTable)
    .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id))
    .where(and(
      eq(userProgressTable.user_id, query.user_id),
      lte(userProgressTable.next_review_at, currentTime),
      ne(userProgressTable.srs_level, 'BURNED')
    ))
    .orderBy(asc(userProgressTable.next_review_at))
    .limit(query.limit)
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to get reviews due:', error);
    throw error;
  }
};
