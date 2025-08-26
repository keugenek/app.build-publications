import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { deleteMoodLog } from '../handlers/delete_mood_log';
import { eq } from 'drizzle-orm';
import type { CreateMoodLogInput } from '../schema';

describe('deleteMoodLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing mood log', async () => {
    // First create a mood log to delete
    const testMoodLog: CreateMoodLogInput = {
      mood: 'Happy',
      note: 'Feeling great today!'
    };

    const createdMoodLog = await db.insert(moodLogsTable)
      .values(testMoodLog)
      .returning()
      .execute()
      .then(results => results[0]);

    // Delete the mood log
    const result = await deleteMoodLog(createdMoodLog.id);

    // Check that deletion was successful
    expect(result).toBe(true);

    // Verify the mood log no longer exists in the database
    const moodLogs = await db.select()
      .from(moodLogsTable)
      .where(eq(moodLogsTable.id, createdMoodLog.id))
      .execute();

    expect(moodLogs).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent mood log', async () => {
    // Try to delete a mood log that doesn't exist
    const result = await deleteMoodLog(99999);

    // Should return false since no record was deleted
    expect(result).toBe(false);
  });

  it('should properly handle errors', async () => {
    // Test with invalid input (we'll just check that it handles the error properly)
    await expect(deleteMoodLog(NaN))
      .rejects
      .toThrow();
  });
});
