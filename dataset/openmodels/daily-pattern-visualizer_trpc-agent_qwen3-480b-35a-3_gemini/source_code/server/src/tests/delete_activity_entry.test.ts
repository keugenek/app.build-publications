import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { createActivityEntryInputSchema } from '../schema';
import { deleteActivityEntry } from '../handlers/delete_activity_entry';
import { eq } from 'drizzle-orm';

// Test input data matching the CreateActivityEntryInput schema
const testEntry = {
  user_id: 'user123',
  date: new Date('2023-01-15'),
  sleep_hours: 8.5,
  work_hours: 7.5,
  social_time: 2.0,
  screen_time: 4.5,
  emotional_energy: 7
};

describe('deleteActivityEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing activity entry', async () => {
    // First, create an entry to delete
    const createdEntry = await db.insert(activityEntriesTable)
      .values({
        ...testEntry,
        sleep_hours: testEntry.sleep_hours.toString(),
        work_hours: testEntry.work_hours.toString(),
        social_time: testEntry.social_time.toString(),
        screen_time: testEntry.screen_time.toString()
      })
      .returning()
      .execute();

    const entryId = createdEntry[0].id;

    // Delete the entry
    const result = await deleteActivityEntry(entryId);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify the entry no longer exists in the database
    const entries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent entry', async () => {
    // Try to delete an entry that doesn't exist
    const result = await deleteActivityEntry(99999);

    // Should return false since no entry was deleted
    expect(result).toBe(false);
  });

  it('should properly handle numeric conversions when creating test data', async () => {
    // Create an entry with specific numeric values
    const createdEntry = await db.insert(activityEntriesTable)
      .values({
        ...testEntry,
        sleep_hours: testEntry.sleep_hours.toString(),
        work_hours: testEntry.work_hours.toString(),
        social_time: testEntry.social_time.toString(),
        screen_time: testEntry.screen_time.toString()
      })
      .returning()
      .execute();

    const entryId = createdEntry[0].id;

    // Verify the created entry has the correct values
    const entries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(1);
    expect(parseFloat(entries[0].sleep_hours)).toBeCloseTo(testEntry.sleep_hours);
    expect(parseFloat(entries[0].work_hours)).toBeCloseTo(testEntry.work_hours);
    expect(parseFloat(entries[0].social_time)).toBeCloseTo(testEntry.social_time);
    expect(parseFloat(entries[0].screen_time)).toBeCloseTo(testEntry.screen_time);
    expect(entries[0].emotional_energy).toBe(testEntry.emotional_energy);

    // Now delete the entry
    const result = await deleteActivityEntry(entryId);
    expect(result).toBe(true);

    // Verify it's gone
    const remainingEntries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.id, entryId))
      .execute();

    expect(remainingEntries).toHaveLength(0);
  });
});
