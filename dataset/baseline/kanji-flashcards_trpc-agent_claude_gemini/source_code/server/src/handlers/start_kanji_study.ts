import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type StartKanjiStudyInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const startKanjiStudy = async (input: StartKanjiStudyInput): Promise<UserProgress> => {
  try {
    // First verify the kanji exists
    const kanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, input.kanji_id))
      .execute();

    if (kanji.length === 0) {
      throw new Error(`Kanji with ID ${input.kanji_id} not found`);
    }

    // Check if user is already studying this kanji
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    if (existingProgress.length > 0) {
      throw new Error(`User ${input.user_id} is already studying kanji with ID ${input.kanji_id}`);
    }

    // Create new user progress entry
    const nextReviewAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
    const now = new Date();

    const result = await db.insert(userProgressTable)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        srs_level: 'APPRENTICE_1',
        next_review_at: nextReviewAt,
        correct_streak: 0,
        incorrect_count: 0,
        last_reviewed_at: null,
        created_at: now,
        updated_at: now
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Start kanji study failed:', error);
    throw error;
  }
};
