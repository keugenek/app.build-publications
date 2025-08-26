import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type DeleteWellnessEntryInput } from '../schema';
import { deleteWellnessEntry } from '../handlers/delete_wellness_entry';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteWellnessEntryInput = {
  id: 1
};

describe('deleteWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing wellness entry', async () => {
    // First, create a wellness entry to delete
    const insertResult = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 'user123',
        date: '2023-12-01',
        sleep_hours: '8.5',
        stress_level: 3,
        caffeine_intake: '150.0',
        alcohol_intake: '1.0',
        wellness_score: '85.5'
      })
      .returning()
      .execute();

    const entryId = insertResult[0].id;

    // Delete the entry
    const result = await deleteWellnessEntry({ id: entryId });

    // Should return success
    expect(result.success).toBe(true);

    // Verify entry was actually deleted from database
    const remainingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entryId))
      .execute();

    expect(remainingEntries).toHaveLength(0);
  });

  it('should return false for non-existent wellness entry', async () => {
    // Try to delete an entry that doesn't exist
    const result = await deleteWellnessEntry({ id: 999 });

    // Should return success: false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other wellness entries when deleting one', async () => {
    // Create multiple wellness entries
    const insertResults = await db.insert(wellnessEntriesTable)
      .values([
        {
          user_id: 'user123',
          date: '2023-12-01',
          sleep_hours: '8.5',
          stress_level: 3,
          caffeine_intake: '150.0',
          alcohol_intake: '1.0',
          wellness_score: '85.5'
        },
        {
          user_id: 'user456',
          date: '2023-12-02',
          sleep_hours: '7.0',
          stress_level: 5,
          caffeine_intake: '200.0',
          alcohol_intake: '2.5',
          wellness_score: '70.0'
        }
      ])
      .returning()
      .execute();

    const firstEntryId = insertResults[0].id;
    const secondEntryId = insertResults[1].id;

    // Delete only the first entry
    const result = await deleteWellnessEntry({ id: firstEntryId });

    expect(result.success).toBe(true);

    // Verify first entry is deleted
    const firstEntryCheck = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, firstEntryId))
      .execute();

    expect(firstEntryCheck).toHaveLength(0);

    // Verify second entry still exists
    const secondEntryCheck = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, secondEntryId))
      .execute();

    expect(secondEntryCheck).toHaveLength(1);
    expect(secondEntryCheck[0].user_id).toEqual('user456');
  });

  it('should handle deletion of entry with different data types correctly', async () => {
    // Create an entry with various numeric values to test proper handling
    const insertResult = await db.insert(wellnessEntriesTable)
      .values({
        user_id: 'test_user',
        date: '2023-11-15',
        sleep_hours: '6.25', // Decimal sleep hours
        stress_level: 8, // High stress
        caffeine_intake: '350.75', // High caffeine with decimal
        alcohol_intake: '0.5', // Half drink
        wellness_score: '45.25' // Low wellness score with decimal
      })
      .returning()
      .execute();

    const entryId = insertResult[0].id;

    // Delete the entry
    const result = await deleteWellnessEntry({ id: entryId });

    expect(result.success).toBe(true);

    // Verify complete removal
    const checkEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entryId))
      .execute();

    expect(checkEntries).toHaveLength(0);
  });

  it('should work with negative ID values', async () => {
    // Try to delete with a negative ID (should return false)
    const result = await deleteWellnessEntry({ id: -1 });

    expect(result.success).toBe(false);
  });
});
