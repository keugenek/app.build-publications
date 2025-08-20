import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { progresses } from '../db/schema';
import { type CreateProgressInput } from '../schema';
import { createProgress } from '../handlers/create_progress';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProgressInput = {
  user_id: 1,
  kanji_id: 1,
  next_review: new Date(),
  interval_days: 1,
  easiness_factor: 2.5
};

describe('createProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a progress record', async () => {
    const result = await createProgress(testInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.kanji_id).toEqual(testInput.kanji_id);
    expect(result.interval_days).toEqual(testInput.interval_days);
    expect(result.easiness_factor).toEqual(testInput.easiness_factor);
    expect(result.next_review).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the progress record in the database', async () => {
    const result = await createProgress(testInput);

    const rows = await db.select().from(progresses).where(eq(progresses.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.user_id).toEqual(testInput.user_id);
    expect(row.kanji_id).toEqual(testInput.kanji_id);
    expect(row.interval_days).toEqual(testInput.interval_days);
    // numeric column stored as string, convert for comparison
    expect(parseFloat(row.easiness_factor as unknown as string)).toEqual(testInput.easiness_factor);
    expect(row.next_review).toBeInstanceOf(Date);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
