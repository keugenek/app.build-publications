import { db } from '../db';
import { userProgressTable, usersTable, kanjiTable } from '../db/schema';
import { type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function startLearningKanji(userId: number, kanjiId: number): Promise<UserProgress> {
  try {
    // First verify that both user and kanji exist
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    const kanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, kanjiId))
      .limit(1)
      .execute();

    if (kanji.length === 0) {
      throw new Error(`Kanji with id ${kanjiId} not found`);
    }

    // Check if user already has progress for this kanji
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, userId),
          eq(userProgressTable.kanji_id, kanjiId)
        )
      )
      .limit(1)
      .execute();

    // If progress already exists, return existing record
    if (existingProgress.length > 0) {
      return existingProgress[0];
    }

    // Create new user_progress record
    const nextReviewDate = new Date(); // Immediate first review
    
    const result = await db.insert(userProgressTable)
      .values({
        user_id: userId,
        kanji_id: kanjiId,
        srs_level: 'APPRENTICE_1',
        next_review_at: nextReviewDate,
        correct_streak: 0,
        total_reviews: 0
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Start learning kanji failed:', error);
    throw error;
  }
}
