import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { deleteMoodEntry } from '../handlers/delete_mood_entry';
import { eq } from 'drizzle-orm';

describe('deleteMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing mood entry', async () => {
    // First create a mood entry to delete
    const result = await db.insert(moodEntriesTable)
      .values({
        date: '2023-01-01',
        mood_level: 5,
        notes: 'Test mood entry'
      })
      .returning()
      .execute();
    
    const createdEntry = result[0];
    expect(createdEntry).toBeDefined();
    expect(createdEntry.id).toBeDefined();

    // Delete the mood entry
    await deleteMoodEntry({ id: createdEntry.id });

    // Verify the entry was deleted
    const entries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, createdEntry.id))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should complete successfully when trying to delete a non-existent mood entry', async () => {
    // Try to delete a mood entry that doesn't exist
    // This should complete successfully (delete operations don't fail if nothing matches)
    await expect(deleteMoodEntry({ id: 99999 })).resolves.toBeUndefined();
  });

  it('should only delete the specified mood entry when multiple exist', async () => {
    // Create two mood entries
    const result1 = await db.insert(moodEntriesTable)
      .values({
        date: '2023-01-01',
        mood_level: 5,
        notes: 'First mood entry'
      })
      .returning()
      .execute();
    
    const result2 = await db.insert(moodEntriesTable)
      .values({
        date: '2023-01-02',
        mood_level: 8,
        notes: 'Second mood entry'
      })
      .returning()
      .execute();
    
    const firstEntry = result1[0];
    const secondEntry = result2[0];

    // Delete only the first entry
    await deleteMoodEntry({ id: firstEntry.id });

    // Verify only the first entry was deleted
    const entries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(secondEntry.id);
  });
});
