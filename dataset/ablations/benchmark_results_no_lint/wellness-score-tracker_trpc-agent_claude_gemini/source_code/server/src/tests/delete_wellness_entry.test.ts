import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type DeleteWellnessEntryInput } from '../schema';
import { deleteWellnessEntry } from '../handlers/delete_wellness_entry';
import { eq, and } from 'drizzle-orm';

// Helper function to create a test wellness entry
const createTestEntry = async (user_id: string = 'user123') => {
  const result = await db.insert(wellnessEntriesTable)
    .values({
      user_id,
      date: '2024-01-15',
      sleep_hours: '7.5',
      stress_level: 5,
      caffeine_intake: 200,
      alcohol_intake: 1,
      wellness_score: '75.5'
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a wellness entry that belongs to the user', async () => {
    // Create a test entry
    const entry = await createTestEntry('user123');

    const input: DeleteWellnessEntryInput = {
      id: entry.id,
      user_id: 'user123'
    };

    // Delete the entry
    const result = await deleteWellnessEntry(input);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the entry no longer exists in the database
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entry.id))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should return false when entry does not exist', async () => {
    const input: DeleteWellnessEntryInput = {
      id: 999, // Non-existent ID
      user_id: 'user123'
    };

    const result = await deleteWellnessEntry(input);

    // Should return false since no entry was deleted
    expect(result).toBe(false);
  });

  it('should return false when entry belongs to different user', async () => {
    // Create entry for user123
    const entry = await createTestEntry('user123');

    const input: DeleteWellnessEntryInput = {
      id: entry.id,
      user_id: 'user456' // Different user trying to delete
    };

    // Attempt to delete with wrong user
    const result = await deleteWellnessEntry(input);

    // Should return false since entry doesn't belong to user456
    expect(result).toBe(false);

    // Verify the entry still exists in the database
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entry.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toBe('user123');
  });

  it('should only delete the specified entry when multiple entries exist', async () => {
    // Create multiple entries for the same user
    const entry1 = await createTestEntry('user123');
    const entry2 = await createTestEntry('user123');
    const entry3 = await createTestEntry('user456'); // Different user

    const input: DeleteWellnessEntryInput = {
      id: entry1.id,
      user_id: 'user123'
    };

    // Delete only the first entry
    const result = await deleteWellnessEntry(input);

    expect(result).toBe(true);

    // Verify only the specified entry was deleted
    const allEntries = await db.select()
      .from(wellnessEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);

    // Verify entry1 is gone
    const deletedEntry = allEntries.find(e => e.id === entry1.id);
    expect(deletedEntry).toBeUndefined();

    // Verify other entries still exist
    const remainingEntry2 = allEntries.find(e => e.id === entry2.id);
    const remainingEntry3 = allEntries.find(e => e.id === entry3.id);
    
    expect(remainingEntry2).toBeDefined();
    expect(remainingEntry2?.user_id).toBe('user123');
    
    expect(remainingEntry3).toBeDefined();
    expect(remainingEntry3?.user_id).toBe('user456');
  });

  it('should handle user isolation correctly', async () => {
    // Create entries for different users with same relative IDs
    const userAEntry = await createTestEntry('userA');
    const userBEntry = await createTestEntry('userB');

    // User A tries to delete their own entry - should succeed
    const resultA = await deleteWellnessEntry({
      id: userAEntry.id,
      user_id: 'userA'
    });

    expect(resultA).toBe(true);

    // User B tries to delete user A's entry (now deleted) - should fail
    const resultB = await deleteWellnessEntry({
      id: userAEntry.id,
      user_id: 'userB'
    });

    expect(resultB).toBe(false);

    // Verify user B's entry is still intact
    const remainingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.user_id, 'userB'))
      .execute();

    expect(remainingEntries).toHaveLength(1);
    expect(remainingEntries[0].id).toBe(userBEntry.id);
  });
});
