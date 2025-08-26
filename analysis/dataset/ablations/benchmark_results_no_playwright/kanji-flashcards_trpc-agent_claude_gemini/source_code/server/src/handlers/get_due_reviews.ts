import { db } from '../db';
import { userProgressTable, kanjiTable } from '../db/schema';
import { type GetDueReviewsInput, type KanjiWithProgress } from '../schema';
import { eq, lte, asc, and } from 'drizzle-orm';

export const getDueReviews = async (input: GetDueReviewsInput): Promise<KanjiWithProgress[]> => {
  try {
    const currentTime = new Date();
    
    // Query user progress items that are due for review, joined with kanji data
    const results = await db.select()
      .from(userProgressTable)
      .innerJoin(kanjiTable, eq(userProgressTable.kanji_id, kanjiTable.id))
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          lte(userProgressTable.next_review_at, currentTime)
        )
      )
      .orderBy(asc(userProgressTable.next_review_at))
      .limit(input.limit)
      .execute();

    // Transform joined results into KanjiWithProgress format
    return results.map((result: any) => ({
      id: result.kanji.id,
      character: result.kanji.character,
      meaning_english: result.kanji.meaning_english,
      reading_hiragana: result.kanji.reading_hiragana,
      reading_katakana: result.kanji.reading_katakana,
      jlpt_level: result.kanji.jlpt_level,
      created_at: result.kanji.created_at,
      user_progress: {
        id: result.user_progress.id,
        user_id: result.user_progress.user_id,
        kanji_id: result.user_progress.kanji_id,
        srs_level: result.user_progress.srs_level,
        next_review_at: result.user_progress.next_review_at,
        correct_streak: result.user_progress.correct_streak,
        total_reviews: result.user_progress.total_reviews,
        created_at: result.user_progress.created_at,
        updated_at: result.user_progress.updated_at
      }
    }));
  } catch (error) {
    console.error('Get due reviews failed:', error);
    throw error;
  }
};
