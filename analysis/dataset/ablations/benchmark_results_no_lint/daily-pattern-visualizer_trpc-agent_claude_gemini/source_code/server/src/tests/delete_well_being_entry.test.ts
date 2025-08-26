import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteWellBeingEntry } from '../handlers/delete_well_being_entry';

describe('deleteWellBeingEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing well-being entry', async () => {
    // Create a test entry first
    const insertResult = await db.insert(wellBeingEntriesTable)
      .values({
        date: '2024-01-01',
        sleep_hours: 8.5,
        work_hours: 8.0,
        social_time_hours: 2.5,
        screen_time_hours: 4.0,
        emotional_energy_level: 7
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    expect(createdEntry.id).toBeDefined();

    // Delete the entry
    const result = await deleteWellBeingEntry(createdEntry.id);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the entry is actually deleted from database
    const remainingEntries = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, createdEntry.id))
      .execute();

    expect(remainingEntries).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent entry', async () => {
    // Try to delete an entry with ID that doesn't exist
    const result = await deleteWellBeingEntry(999);

    // Should return false indicating no record was found/deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified entry, not others', async () => {
    // Create multiple test entries
    const insertResults = await db.insert(wellBeingEntriesTable)
      .values([
        {
          date: '2024-01-01',
          sleep_hours: 8.5,
          work_hours: 8.0,
          social_time_hours: 2.5,
          screen_time_hours: 4.0,
          emotional_energy_level: 7
        },
        {
          date: '2024-01-02',
          sleep_hours: 7.0,
          work_hours: 9.0,
          social_time_hours: 1.5,
          screen_time_hours: 5.0,
          emotional_energy_level: 6
        },
        {
          date: '2024-01-03',
          sleep_hours: 9.0,
          work_hours: 7.0,
          social_time_hours: 3.0,
          screen_time_hours: 3.5,
          emotional_energy_level: 8
        }
      ])
      .returning()
      .execute();

    expect(insertResults).toHaveLength(3);

    // Delete only the middle entry
    const targetEntry = insertResults[1];
    const result = await deleteWellBeingEntry(targetEntry.id);

    expect(result).toBe(true);

    // Verify only the target entry was deleted
    const remainingEntries = await db.select()
      .from(wellBeingEntriesTable)
      .execute();

    expect(remainingEntries).toHaveLength(2);

    // Verify the correct entry was deleted
    const deletedEntryCheck = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, targetEntry.id))
      .execute();

    expect(deletedEntryCheck).toHaveLength(0);

    // Verify the other entries still exist
    const firstEntryCheck = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, insertResults[0].id))
      .execute();

    const thirdEntryCheck = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, insertResults[2].id))
      .execute();

    expect(firstEntryCheck).toHaveLength(1);
    expect(thirdEntryCheck).toHaveLength(1);
  });

  it('should handle edge case with negative ID gracefully', async () => {
    // Try to delete with negative ID
    const result = await deleteWellBeingEntry(-1);

    // Should return false indicating no record was found/deleted
    expect(result).toBe(false);
  });

  it('should handle edge case with zero ID gracefully', async () => {
    // Try to delete with zero ID (serial IDs start from 1)
    const result = await deleteWellBeingEntry(0);

    // Should return false indicating no record was found/deleted
    expect(result).toBe(false);
  });
});
