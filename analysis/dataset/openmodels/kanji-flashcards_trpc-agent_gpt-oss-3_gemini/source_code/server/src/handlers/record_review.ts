import { type RecordReviewInput, type KanjiProgress } from '../schema';
import { db } from '../db';
import { kanjiProgressTable } from '../db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Record a review result for a kanji using the SM-2 algorithm.
 * Updates an existing KanjiProgress record or creates a new one.
 */
export const recordReview = async (input: RecordReviewInput): Promise<KanjiProgress> => {
  const now = new Date();

  // Fetch existing progress for this user and kanji
  const existing = await db
    .select()
    .from(kanjiProgressTable)
    .where(
      and(
        eq(kanjiProgressTable.user_id, input.user_id),
        eq(kanjiProgressTable.kanji_id, input.kanji_id)
      )
    )
    .limit(1)
    .execute();

  const progress = existing[0];

  // SM-2 defaults – efactor stored as integer *100 to avoid floating point DB storage
  let interval = progress?.interval_days ?? 1;
  let efactorInt = progress?.efactor ?? 250; // 2.5 * 100

  // Convert to float for calculations
  let ef = efactorInt / 100;
  const q = input.quality;

  // Update easiness factor (EF)
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  // Determine next interval based on quality
  let newInterval: number;
  if (q >= 3) {
    if (!progress) {
      newInterval = 1;
    } else if (interval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * ef);
    }
  } else {
    // Failure – repeat after 1 day
    newInterval = 1;
  }

  // Calculate next review timestamp
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  const newEfInt = Math.round(ef * 100);

  if (progress) {
    // Update existing record
    await db
      .update(kanjiProgressTable)
      .set({
        interval_days: newInterval,
        efactor: newEfInt,
        next_review: nextReview,
        last_reviewed_at: now,
      })
      .where(
        and(
          eq(kanjiProgressTable.user_id, input.user_id),
          eq(kanjiProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    const updated = await db
      .select()
      .from(kanjiProgressTable)
      .where(
        and(
          eq(kanjiProgressTable.user_id, input.user_id),
          eq(kanjiProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();
    return updated[0];
  } else {
    // Insert a new progress record
    const inserted = await db
      .insert(kanjiProgressTable)
      .values({
        user_id: input.user_id,
        kanji_id: input.kanji_id,
        next_review: nextReview,
        interval_days: newInterval,
        efactor: newEfInt,
        last_reviewed_at: now,
      })
      .returning()
      .execute();
    return inserted[0];
  }
};
