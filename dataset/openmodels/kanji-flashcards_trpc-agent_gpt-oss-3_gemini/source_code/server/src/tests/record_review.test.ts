import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { kanjiProgressTable } from '../db/schema';
import { type RecordReviewInput, type KanjiProgress } from '../schema';
import { recordReview } from '../handlers/record_review';
import { and, eq } from 'drizzle-orm';

// Helper to fetch progress directly
const getProgress = async (userId: number, kanjiId: number): Promise<KanjiProgress | undefined> => {
  const rows = await db
    .select()
    .from(kanjiProgressTable)
    .where(
      and(
        eq(kanjiProgressTable.user_id, userId),
        eq(kanjiProgressTable.kanji_id, kanjiId)
      )
    )
    .execute();
  return rows[0];
};

describe('recordReview handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const input: RecordReviewInput = {
    user_id: 1,
    kanji_id: 42,
    quality: 4,
  };

  it('creates a new progress record when none exists', async () => {
    const result = await recordReview(input);
    expect(result.user_id).toBe(input.user_id);
    expect(result.kanji_id).toBe(input.kanji_id);
    expect(result.interval_days).toBe(1); // first review defaults to 1 day
    expect(result.efactor).toBeGreaterThanOrEqual(250);
    expect(result.next_review).toBeInstanceOf(Date);
    expect(result.last_reviewed_at).toBeInstanceOf(Date);
  });

  it('updates an existing progress record on subsequent review', async () => {
    // First call creates record
    await recordReview(input);
    // Second call with higher quality should increase interval
    const secondInput = { ...input, quality: 5 };
    const updated = await recordReview(secondInput);
    expect(updated.interval_days).toBeGreaterThan(1);
    // Verify DB state matches returned value
    const dbRow = await getProgress(input.user_id, input.kanji_id);
    expect(dbRow?.interval_days).toBe(updated.interval_days);
    expect(dbRow?.efactor).toBe(updated.efactor);
  });
});
