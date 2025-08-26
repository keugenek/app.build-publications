import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { deleteWellnessEntry } from '../handlers/delete_wellness_entry';
import { eq } from 'drizzle-orm';

describe('deleteWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing wellness entry', async () => {
    // Create a test wellness entry
    const testEntry = await db.insert(wellnessEntriesTable)
      .values({
        sleep_hours: '8.5',
        stress_level: 3,
        caffeine_intake: '150.0',
        alcohol_intake: '1.5',
        wellness_score: '75.0',
        entry_date: '2024-01-15'
      })
      .returning()
      .execute();

    const entryId = testEntry[0].id;

    // Delete the entry
    const result = await deleteWellnessEntry(entryId);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify entry is deleted from database
    const deletedEntry = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entryId))
      .execute();

    expect(deletedEntry).toHaveLength(0);
  });

  it('should return false when deleting non-existent entry', async () => {
    // Try to delete an entry that doesn't exist
    const result = await deleteWellnessEntry(99999);

    // Should return false when no entry is found
    expect(result).toBe(false);
  });

  it('should return false for invalid ID values', async () => {
    // Test negative ID
    const negativeResult = await deleteWellnessEntry(-1);
    expect(negativeResult).toBe(false);

    // Test zero ID
    const zeroResult = await deleteWellnessEntry(0);
    expect(zeroResult).toBe(false);
  });

  it('should not affect other entries when deleting specific entry', async () => {
    // Create multiple test entries
    const entries = await db.insert(wellnessEntriesTable)
      .values([
        {
          sleep_hours: '7.0',
          stress_level: 4,
          caffeine_intake: '200.0',
          alcohol_intake: '0.0',
          wellness_score: '65.0',
          entry_date: '2024-01-14'
        },
        {
          sleep_hours: '8.5',
          stress_level: 2,
          caffeine_intake: '100.0',
          alcohol_intake: '2.0',
          wellness_score: '80.0',
          entry_date: '2024-01-15'
        },
        {
          sleep_hours: '6.5',
          stress_level: 6,
          caffeine_intake: '300.0',
          alcohol_intake: '1.0',
          wellness_score: '55.0',
          entry_date: '2024-01-16'
        }
      ])
      .returning()
      .execute();

    const entryToDelete = entries[1].id;

    // Delete the middle entry
    const result = await deleteWellnessEntry(entryToDelete);
    expect(result).toBe(true);

    // Verify only the targeted entry was deleted
    const remainingEntries = await db.select()
      .from(wellnessEntriesTable)
      .execute();

    expect(remainingEntries).toHaveLength(2);
    
    // Verify the correct entries remain
    const remainingIds = remainingEntries.map(entry => entry.id);
    expect(remainingIds).toContain(entries[0].id);
    expect(remainingIds).toContain(entries[2].id);
    expect(remainingIds).not.toContain(entryToDelete);
  });

  it('should handle database constraint scenarios', async () => {
    // Create and delete an entry to test edge cases
    const testEntry = await db.insert(wellnessEntriesTable)
      .values({
        sleep_hours: '9.0',
        stress_level: 1,
        caffeine_intake: '50.0',
        alcohol_intake: '0.5',
        wellness_score: '90.0',
        entry_date: '2024-01-17'
      })
      .returning()
      .execute();

    const entryId = testEntry[0].id;

    // Delete the entry
    const firstResult = await deleteWellnessEntry(entryId);
    expect(firstResult).toBe(true);

    // Try to delete the same entry again
    const secondResult = await deleteWellnessEntry(entryId);
    expect(secondResult).toBe(false);
  });
});
