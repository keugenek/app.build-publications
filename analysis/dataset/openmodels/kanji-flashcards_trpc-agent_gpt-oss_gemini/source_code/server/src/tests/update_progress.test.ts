import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { progresses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateProgressInput } from '../schema';
import { updateProgress } from '../handlers/update_progress';

// Helper to create a progress record
const createInitialProgress = async () => {
  const result = await db
    .insert(progresses)
    .values({
      user_id: 1,
      kanji_id: 1,
      next_review: new Date(),
      interval_days: 1,
      easiness_factor: '2.5' // numeric column stored as string
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update only provided fields and convert numeric correctly', async () => {
    const original = await createInitialProgress();

    const input: UpdateProgressInput = {
      id: original.id,
      interval_days: 5,
      easiness_factor: 2.0 // new value
    };

    const updated = await updateProgress(input);

    // Verify returned object
    expect(updated.id).toBe(original.id);
    expect(updated.user_id).toBe(original.user_id);
    expect(updated.kanji_id).toBe(original.kanji_id);
    expect(updated.interval_days).toBe(5);
    expect(updated.easiness_factor).toBe(2.0);
    // next_review unchanged
    expect(updated.next_review.getTime()).toBe(original.next_review.getTime());

    // Verify DB state
    const dbRecord = await db
      .select()
      .from(progresses)
      .where(eq(progresses.id, original.id))
      .execute();

    const record = dbRecord[0];
    expect(record.interval_days).toBe(5);
    // numeric column stored as string, convert for comparison
    const ef = typeof record.easiness_factor === 'string'
      ? parseFloat(record.easiness_factor)
      : record.easiness_factor;
    expect(ef).toBe(2.0);
  });

  it('should throw when record does not exist', async () => {
    const input: UpdateProgressInput = {
      id: 9999,
      interval_days: 10
    };
    await expect(updateProgress(input)).rejects.toThrow(/Progress record not found/);
  });
});
