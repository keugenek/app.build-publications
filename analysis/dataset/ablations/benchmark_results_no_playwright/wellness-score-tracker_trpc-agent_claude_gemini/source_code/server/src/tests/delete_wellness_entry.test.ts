import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput } from '../schema';
import { deleteWellnessEntry } from '../handlers/delete_wellness_entry';
import { eq, and } from 'drizzle-orm';

describe('deleteWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing wellness entry', async () => {
    // Create test wellness entry
    const insertResult = await db
      .insert(wellnessEntriesTable)
      .values({
        user_id: 1,
        date: '2024-01-15',
        hours_of_sleep: 8.0,
        stress_level: 5,
        caffeine_intake: 100.0,
        alcohol_intake: 1.0,
        wellness_score: 7.5
      })
      .returning({ id: wellnessEntriesTable.id })
      .execute();

    const entryId = insertResult[0].id;

    // Delete the wellness entry
    const input: GetWellnessEntryInput = {
      id: entryId,
      user_id: 1
    };

    const result = await deleteWellnessEntry(input);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify entry was actually deleted from database
    const entries = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent entry', async () => {
    const input: GetWellnessEntryInput = {
      id: 999, // Non-existent ID
      user_id: 1
    };

    const result = await deleteWellnessEntry(input);

    // Should return false when entry doesn't exist
    expect(result).toBe(false);
  });

  it('should return false when trying to delete another user\'s entry', async () => {
    // Create test wellness entry for user 1
    const insertResult = await db
      .insert(wellnessEntriesTable)
      .values({
        user_id: 1,
        date: '2024-01-15',
        hours_of_sleep: 8.0,
        stress_level: 5,
        caffeine_intake: 100.0,
        alcohol_intake: 1.0,
        wellness_score: 7.5
      })
      .returning({ id: wellnessEntriesTable.id })
      .execute();

    const entryId = insertResult[0].id;

    // Try to delete as a different user
    const input: GetWellnessEntryInput = {
      id: entryId,
      user_id: 2 // Different user trying to delete
    };

    const result = await deleteWellnessEntry(input);

    // Should return false - user can't delete another user's entry
    expect(result).toBe(false);

    // Verify entry still exists in database
    const entries = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toBe(1);
  });

  it('should only delete the specific entry when multiple entries exist', async () => {
    // Create multiple test wellness entries for the same user
    const entries = [
      {
        user_id: 1,
        date: '2024-01-15',
        hours_of_sleep: 8.0,
        stress_level: 5,
        caffeine_intake: 100.0,
        alcohol_intake: 1.0,
        wellness_score: 7.5
      },
      {
        user_id: 1,
        date: '2024-01-16',
        hours_of_sleep: 7.5,
        stress_level: 6,
        caffeine_intake: 150.0,
        alcohol_intake: 0.0,
        wellness_score: 6.8
      }
    ];

    const insertResults = await db
      .insert(wellnessEntriesTable)
      .values(entries)
      .returning({ id: wellnessEntriesTable.id })
      .execute();

    const firstEntryId = insertResults[0].id;
    const secondEntryId = insertResults[1].id;

    // Delete only the first entry
    const input: GetWellnessEntryInput = {
      id: firstEntryId,
      user_id: 1
    };

    const result = await deleteWellnessEntry(input);

    expect(result).toBe(true);

    // Verify only the first entry was deleted
    const firstEntryCheck = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, firstEntryId))
      .execute();

    expect(firstEntryCheck).toHaveLength(0);

    // Verify the second entry still exists
    const secondEntryCheck = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, secondEntryId))
      .execute();

    expect(secondEntryCheck).toHaveLength(1);
    expect(secondEntryCheck[0].date).toBe('2024-01-16');
  });

  it('should validate user ownership correctly with edge cases', async () => {
    // Create entries for different users
    const user1Entry = {
      user_id: 1,
      date: '2024-01-15',
      hours_of_sleep: 8.0,
      stress_level: 5,
      caffeine_intake: 100.0,
      alcohol_intake: 1.0,
      wellness_score: 7.5
    };

    const user2Entry = {
      user_id: 2,
      date: '2024-01-15',
      hours_of_sleep: 7.0,
      stress_level: 7,
      caffeine_intake: 200.0,
      alcohol_intake: 2.0,
      wellness_score: 6.0
    };

    const insertResults = await db
      .insert(wellnessEntriesTable)
      .values([user1Entry, user2Entry])
      .returning({ id: wellnessEntriesTable.id, user_id: wellnessEntriesTable.user_id })
      .execute();

    const user1EntryId = insertResults.find(r => r.user_id === 1)?.id;
    const user2EntryId = insertResults.find(r => r.user_id === 2)?.id;

    // Ensure we found both entries
    expect(user1EntryId).toBeDefined();
    expect(user2EntryId).toBeDefined();

    // User 1 should be able to delete their own entry
    const deleteUser1Result = await deleteWellnessEntry({
      id: user1EntryId!,
      user_id: 1
    });

    expect(deleteUser1Result).toBe(true);

    // User 1 should NOT be able to delete user 2's entry
    const deleteUser2AsUser1Result = await deleteWellnessEntry({
      id: user2EntryId!,
      user_id: 1
    });

    expect(deleteUser2AsUser1Result).toBe(false);

    // Verify user 2's entry still exists
    const remainingEntries = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.user_id, 2))
      .execute();

    expect(remainingEntries).toHaveLength(1);
    expect(remainingEntries[0].id).toBe(user2EntryId!);
  });
});
