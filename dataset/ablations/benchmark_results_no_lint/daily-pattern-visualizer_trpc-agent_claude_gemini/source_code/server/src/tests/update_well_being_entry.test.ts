import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type UpdateWellBeingEntryInput, type CreateWellBeingEntryInput } from '../schema';
import { updateWellBeingEntry } from '../handlers/update_well_being_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a test entry in the database
const createTestEntry = async (): Promise<number> => {
  const testEntry: CreateWellBeingEntryInput = {
    date: new Date('2024-01-15'),
    sleep_hours: 8.0,
    work_hours: 8.0,
    social_time_hours: 2.0,
    screen_time_hours: 4.0,
    emotional_energy_level: 7
  };

  const result = await db.insert(wellBeingEntriesTable)
    .values({
      date: testEntry.date.toISOString().split('T')[0],
      sleep_hours: testEntry.sleep_hours,
      work_hours: testEntry.work_hours,
      social_time_hours: testEntry.social_time_hours,
      screen_time_hours: testEntry.screen_time_hours,
      emotional_energy_level: testEntry.emotional_energy_level
    })
    .returning({ id: wellBeingEntriesTable.id })
    .execute();

  return result[0].id;
};

describe('updateWellBeingEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a well-being entry', async () => {
    const entryId = await createTestEntry();

    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      date: new Date('2024-01-16'),
      sleep_hours: 7.5,
      work_hours: 9.0,
      social_time_hours: 3.0,
      screen_time_hours: 5.0,
      emotional_energy_level: 8
    };

    const result = await updateWellBeingEntry(updateInput);

    // Verify all fields were updated correctly
    expect(result.id).toEqual(entryId);
    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.sleep_hours).toEqual(7.5);
    expect(result.work_hours).toEqual(9.0);
    expect(result.social_time_hours).toEqual(3.0);
    expect(result.screen_time_hours).toEqual(5.0);
    expect(result.emotional_energy_level).toEqual(8);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify database was actually updated
    const dbEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, entryId))
      .execute();

    expect(dbEntry).toHaveLength(1);
    expect(new Date(dbEntry[0].date)).toEqual(new Date('2024-01-16'));
    expect(Number(dbEntry[0].sleep_hours)).toEqual(7.5);
    expect(Number(dbEntry[0].work_hours)).toEqual(9.0);
    expect(Number(dbEntry[0].social_time_hours)).toEqual(3.0);
    expect(Number(dbEntry[0].screen_time_hours)).toEqual(5.0);
    expect(dbEntry[0].emotional_energy_level).toEqual(8);
  });

  it('should update only provided fields (partial update)', async () => {
    const entryId = await createTestEntry();

    // Update only sleep_hours and emotional_energy_level
    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      sleep_hours: 6.5,
      emotional_energy_level: 9
    };

    const result = await updateWellBeingEntry(updateInput);

    // Verify updated fields
    expect(result.sleep_hours).toEqual(6.5);
    expect(result.emotional_energy_level).toEqual(9);

    // Verify unchanged fields remain the same
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_time_hours).toEqual(2.0);
    expect(result.screen_time_hours).toEqual(4.0);

    // Verify database reflects partial update
    const dbEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, entryId))
      .execute();

    expect(Number(dbEntry[0].sleep_hours)).toEqual(6.5);
    expect(dbEntry[0].emotional_energy_level).toEqual(9);
    expect(new Date(dbEntry[0].date)).toEqual(new Date('2024-01-15'));
    expect(Number(dbEntry[0].work_hours)).toEqual(8.0);
  });

  it('should update only the date field', async () => {
    const entryId = await createTestEntry();

    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      date: new Date('2024-02-01')
    };

    const result = await updateWellBeingEntry(updateInput);

    expect(result.date).toEqual(new Date('2024-02-01'));
    expect(result.sleep_hours).toEqual(8.0);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_time_hours).toEqual(2.0);
    expect(result.screen_time_hours).toEqual(4.0);
    expect(result.emotional_energy_level).toEqual(7);
  });

  it('should handle decimal values correctly', async () => {
    const entryId = await createTestEntry();

    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      sleep_hours: 7.75,
      work_hours: 8.25,
      social_time_hours: 1.5,
      screen_time_hours: 3.33
    };

    const result = await updateWellBeingEntry(updateInput);

    expect(result.sleep_hours).toEqual(7.75);
    expect(result.work_hours).toEqual(8.25);
    expect(result.social_time_hours).toEqual(1.5);
    expect(result.screen_time_hours).toEqual(3.33);

    // Verify precision is maintained in database
    const dbEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, entryId))
      .execute();

    expect(Number(dbEntry[0].sleep_hours)).toBeCloseTo(7.75, 2);
    expect(Number(dbEntry[0].work_hours)).toBeCloseTo(8.25, 2);
    expect(Number(dbEntry[0].social_time_hours)).toBeCloseTo(1.5, 2);
    expect(Number(dbEntry[0].screen_time_hours)).toBeCloseTo(3.33, 2);
  });

  it('should throw error when entry does not exist', async () => {
    const updateInput: UpdateWellBeingEntryInput = {
      id: 99999, // Non-existent ID
      sleep_hours: 8.0
    };

    await expect(updateWellBeingEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve created_at timestamp when updating', async () => {
    const entryId = await createTestEntry();

    // Get the original created_at timestamp
    const originalEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, entryId))
      .execute();

    const originalCreatedAt = originalEntry[0].created_at;

    // Wait a bit to ensure timestamp would change if incorrectly updated
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      sleep_hours: 9.0
    };

    const result = await updateWellBeingEntry(updateInput);

    // Verify created_at timestamp was preserved
    expect(result.created_at).toEqual(originalCreatedAt);

    // Verify in database as well
    const updatedDbEntry = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, entryId))
      .execute();

    expect(updatedDbEntry[0].created_at).toEqual(originalCreatedAt);
  });

  it('should handle boundary values correctly', async () => {
    const entryId = await createTestEntry();

    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      sleep_hours: 0, // Minimum value
      work_hours: 24, // Maximum value
      social_time_hours: 0,
      screen_time_hours: 24,
      emotional_energy_level: 1 // Minimum energy level
    };

    const result = await updateWellBeingEntry(updateInput);

    expect(result.sleep_hours).toEqual(0);
    expect(result.work_hours).toEqual(24);
    expect(result.social_time_hours).toEqual(0);
    expect(result.screen_time_hours).toEqual(24);
    expect(result.emotional_energy_level).toEqual(1);
  });

  it('should return correct data types', async () => {
    const entryId = await createTestEntry();

    const updateInput: UpdateWellBeingEntryInput = {
      id: entryId,
      sleep_hours: 7.5,
      emotional_energy_level: 8
    };

    const result = await updateWellBeingEntry(updateInput);

    // Verify all numeric fields are actually numbers
    expect(typeof result.sleep_hours).toBe('number');
    expect(typeof result.work_hours).toBe('number');
    expect(typeof result.social_time_hours).toBe('number');
    expect(typeof result.screen_time_hours).toBe('number');
    expect(typeof result.emotional_energy_level).toBe('number');
    expect(typeof result.id).toBe('number');
    
    // Verify date fields are Date objects
    expect(result.date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
