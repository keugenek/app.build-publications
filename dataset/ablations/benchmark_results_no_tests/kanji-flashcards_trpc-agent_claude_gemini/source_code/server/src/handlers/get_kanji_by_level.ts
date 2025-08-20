import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetKanjiByLevelInput, type KanjiWithProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getKanjiByLevel(input: GetKanjiByLevelInput): Promise<KanjiWithProgress[]> {
  try {
    // If user_id is provided, join with user progress to include progress data
    if (input.user_id) {
      const results = await db.select()
        .from(kanjiTable)
        .leftJoin(
          userProgressTable, 
          and(
            eq(userProgressTable.kanji_id, kanjiTable.id),
            eq(userProgressTable.user_id, input.user_id)
          )
        )
        .where(eq(kanjiTable.jlpt_level, input.jlpt_level))
        .execute();

      return results.map(result => ({
        id: result.kanji.id,
        character: result.kanji.character,
        meaning: result.kanji.meaning,
        on_reading: result.kanji.on_reading,
        kun_reading: result.kanji.kun_reading,
        jlpt_level: result.kanji.jlpt_level,
        created_at: result.kanji.created_at,
        progress: result.user_progress ? {
          is_learned: result.user_progress.is_learned,
          review_count: result.user_progress.review_count,
          last_reviewed: result.user_progress.last_reviewed,
          next_review: result.user_progress.next_review
        } : null
      }));
    }

    // If no user_id provided, just return kanji without progress
    const results = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.jlpt_level, input.jlpt_level))
      .execute();

    return results.map(kanji => ({
      id: kanji.id,
      character: kanji.character,
      meaning: kanji.meaning,
      on_reading: kanji.on_reading,
      kun_reading: kanji.kun_reading,
      jlpt_level: kanji.jlpt_level,
      created_at: kanji.created_at,
      progress: null
    }));
  } catch (error) {
    console.error('Failed to get kanji by level:', error);
    throw error;
  }
}
