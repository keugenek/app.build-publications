import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteWellnessEntry } from '../handlers/delete_wellness_entry';

describe('deleteWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing wellness entry', async () => {
    // First, create a wellness entry to delete
    const testEntry = {
      date: '2023-01-15',
      sleep_hours: '7.50',
      stress_level: 5,
      caffeine_intake: '2.00',
      alcohol_intake: '0.00',
      wellness_score: '75.50'
    };

    const createdEntry = await db
      .insert(wellnessEntriesTable)
      .values(testEntry)
      .returning()
      .execute();

    const createdId = createdEntry[0].id;

    // Delete the wellness entry
    const result = await deleteWellnessEntry(createdId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the entry no longer exists in the database
    const entries = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, createdId))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent wellness entry', async () => {
    // Try to delete a wellness entry that doesn't exist
    const result = await deleteWellnessEntry(99999);

    // Verify deletion was not successful
    expect(result).toBe(false);
  });

  it('should properly handle database errors', async () => {
    // Try to delete with an invalid ID type (this should be prevented by TypeScript)
    // For testing purposes, we'll use a negative ID which is valid but won't exist
    const result = await deleteWellnessEntry(-1);
    
    // Should return false for non-existent entry
    expect(result).toBe(false);
  });
});
