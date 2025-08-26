import { db } from '../db';
import { userProgressTable, kanjiTable } from '../db/schema';
import { type CreateUserProgressInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createUserProgress = async (input: CreateUserProgressInput): Promise<UserProgress> => {
  try {
    // First, validate that the kanji exists
    const kanjiExists = await db.select({ id: kanjiTable.id })
      .from(kanjiTable)
      .where(eq(kanjiTable.id, input.kanji_id))
      .execute();

    if (kanjiExists.length === 0) {
      throw new Error(`Kanji with id ${input.kanji_id} does not exist`);
    }

    // Check if progress already exists for this user and kanji
    const existingProgress = await db.select({ id: userProgressTable.id })
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, input.user_id),
        eq(userProgressTable.kanji_id, input.kanji_id)
      ))
      .execute();

    if (existingProgress.length > 0) {
      throw new Error(`Progress already exists for user ${input.user_id} and kanji ${input.kanji_id}`);
    }

    // Insert user progress record
    const result = await db.insert(userProgressTable)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        is_learned: input.is_learned ?? false,
        review_count: input.review_count ?? 0,
        last_reviewed: input.last_reviewed ?? null,
        next_review: input.next_review ?? null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User progress creation failed:', error);
    throw error;
  }
};
