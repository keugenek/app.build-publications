import { db } from '../db';
import { kanjiTable, srsEntriesTable } from '../db/schema';
import { type Flashcard } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getFlashcards = async (): Promise<Flashcard[]> => {
  try {
    // Fetch all kanji with their SRS entries
    const results = await db.select({
      kanji: kanjiTable,
      srs_entry: srsEntriesTable,
    })
    .from(kanjiTable)
    .leftJoin(srsEntriesTable, eq(kanjiTable.id, srsEntriesTable.kanji_id))
    .execute();

    // Transform results into Flashcard format
    return results.map(result => ({
      id: result.kanji.id,
      kanji: {
        id: result.kanji.id,
        kanji: result.kanji.kanji,
        meaning: result.kanji.meaning,
        onyomi: result.kanji.onyomi,
        kunyomi: result.kanji.kunyomi,
        jlpt_level: result.kanji.jlpt_level,
        created_at: result.kanji.created_at,
      },
      srs_entry: result.srs_entry ? {
        id: result.srs_entry.id,
        user_id: result.srs_entry.user_id,
        kanji_id: result.srs_entry.kanji_id,
        familiarity_level: result.srs_entry.familiarity_level,
        next_review_date: new Date(result.srs_entry.next_review_date),
        last_reviewed_at: result.srs_entry.last_reviewed_at ? new Date(result.srs_entry.last_reviewed_at) : null,
        created_at: result.srs_entry.created_at,
      } : null,
    }));
  } catch (error) {
    console.error('Failed to fetch flashcards:', error);
    throw error;
  }
};
