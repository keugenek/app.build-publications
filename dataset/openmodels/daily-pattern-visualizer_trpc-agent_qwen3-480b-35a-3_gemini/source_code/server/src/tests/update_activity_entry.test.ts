import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type UpdateActivityEntryInput } from '../schema';
import { updateActivityEntry } from '../handlers/update_activity_entry';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Test input for updating an activity entry
const updateInput: UpdateActivityEntryInput = {
  id: 1,
  sleep_hours: 7.0,
  work_hours: 8.0,
  emotional_energy: 6
};

describe('updateActivityEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Manually insert a test record since create handler is not implemented
    await db.insert(activityEntriesTable)
      .values({
        id: 1,
        user_id: 'user123',
        date: new Date('2023-01-01'),
        sleep_hours: '8.5',
        work_hours: '7.5',
        social_time: '2.0',
        screen_time: '4.5',
        emotional_energy: 7
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should update an activity entry', async () => {
    const result = await updateActivityEntry(updateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.sleep_hours).toEqual(7.0);
    expect(result.work_hours).toEqual(8.0);
    expect(result.emotional_energy).toEqual(6);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated entry to database', async () => {
    await updateActivityEntry(updateInput);

    // Query the updated entry
    const entries = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.id, 1))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.sleep_hours).toEqual('7.0');
    expect(entry.work_hours).toEqual('8.0');
    expect(entry.emotional_energy).toEqual(6);
    expect(entry.updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when updating a non-existent entry', async () => {
    const invalidUpdateInput: UpdateActivityEntryInput = {
      id: 999,
      sleep_hours: 6.0
    };

    await expect(updateActivityEntry(invalidUpdateInput))
      .rejects
      .toThrow(/not found/);
  });
});
