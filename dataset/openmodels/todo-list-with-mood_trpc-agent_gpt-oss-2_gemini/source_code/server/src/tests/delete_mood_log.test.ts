import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { type MoodLog, type CreateMoodLogInput } from '../schema';
import { deleteMoodLog } from '../handlers/delete_mood_log';
import { eq } from 'drizzle-orm';

// Helper to insert a mood log for testing
const insertTestLog = async (input: CreateMoodLogInput): Promise<MoodLog> => {
  const result = await db
    .insert(moodLogsTable)
    .values({
      mood: input.mood,
      log_date: input.log_date.toISOString().split('T')[0], // format as YYYY-MM-DD
      note: input.note ?? null,
    })
    .returning()
    .execute();
  const raw = result[0];
    const log: MoodLog = {
      ...raw,
      log_date: new Date(raw.log_date),
      created_at: new Date(raw.created_at),
    } as MoodLog;
    return log;
};

describe('deleteMoodLog handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing mood log and return its data', async () => {
    const testInput: CreateMoodLogInput = {
      mood: 'Sad',
      log_date: new Date('2023-01-01'),
      note: 'Feeling down',
    };
    const inserted = await insertTestLog(testInput);

    const deleted = await deleteMoodLog(inserted.id);

    // Verify returned data matches inserted
    expect(deleted.id).toBe(inserted.id);
    expect(deleted.mood).toBe('Sad');
    expect(deleted.note).toBe('Feeling down');
    expect(deleted.log_date instanceof Date).toBe(true);
    expect(deleted.created_at instanceof Date).toBe(true);

    // Ensure it is removed from DB
    const remaining = await db.select().from(moodLogsTable).where(eq(moodLogsTable.id, inserted.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent mood log', async () => {
    await expect(deleteMoodLog(9999)).rejects.toThrow(/not found/i);
  });
});
