import { beforeEach, afterEach, describe, it, expect } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { progresses } from '../db/schema';
import { type Progress } from '../schema';
import { getProgresses } from '../handlers/get_progress';
import { eq } from 'drizzle-orm';

describe('getProgresses handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no progresses exist', async () => {
    const result = await getProgresses();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch progress records and convert numeric fields', async () => {
    const now = new Date();
    const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
    const insertResult = await db.insert(progresses)
      .values({
        user_id: 1,
        kanji_id: 1,
        next_review: now,
        interval_days: 1,
        easiness_factor: (2.5).toString() // numeric column, will be stored as string
      })
      .returning()
      .execute();

    const inserted = insertResult[0];
    // Ensure inserted easiness_factor is a string (as per Drizzle)
    expect(typeof inserted.easiness_factor).toBe('string');

    const progressesResult = await getProgresses();
    expect(progressesResult).toHaveLength(1);
    const progress = progressesResult[0] as Progress;
    expect(progress.id).toBe(inserted.id);
    expect(progress.user_id).toBe(1);
    expect(progress.kanji_id).toBe(1);
    expect(progress.interval_days).toBe(1);
    expect(progress.easiness_factor).toBe(2.5);
    expect(typeof progress.easiness_factor).toBe('number');
    expect(progress.next_review).toBeInstanceOf(Date);
    expect(progress.created_at).toBeInstanceOf(Date);
  });
});
