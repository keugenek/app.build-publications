import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type CreateWellBeingEntryInput } from '../schema';
import { createWellBeingEntry } from '../handlers/create_well_being_entry';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateWellBeingEntryInput = {
  date: new Date('2024-01-15'),
  sleep_hours: 7.5,
  work_hours: 8.0,
  social_time_hours: 2.5,
  screen_time_hours: 4.0,
  emotional_energy_level: 7
};

describe('createWellBeingEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a well-being entry with all fields', async () => {
    const result = await createWellBeingEntry(testInput);

    // Validate all returned fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.sleep_hours).toEqual(7.5);
    expect(result.work_hours).toEqual(8.0);
    expect(result.social_time_hours).toEqual(2.5);
    expect(result.screen_time_hours).toEqual(4.0);
    expect(result.emotional_energy_level).toEqual(7);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should save entry to database correctly', async () => {
    const result = await createWellBeingEntry(testInput);

    // Query database to verify entry was saved
    const entries = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const savedEntry = entries[0];
    
    expect(savedEntry.id).toEqual(result.id);
    expect(savedEntry.date).toEqual('2024-01-15'); // Date stored as string in DB
    expect(savedEntry.sleep_hours).toEqual(7.5);
    expect(savedEntry.work_hours).toEqual(8.0);
    expect(savedEntry.social_time_hours).toEqual(2.5);
    expect(savedEntry.screen_time_hours).toEqual(4.0);
    expect(savedEntry.emotional_energy_level).toEqual(7);
    expect(savedEntry.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal values correctly', async () => {
    const decimalInput: CreateWellBeingEntryInput = {
      date: new Date('2024-01-16'),
      sleep_hours: 6.75, // Decimal hours
      work_hours: 8.25,
      social_time_hours: 1.5,
      screen_time_hours: 3.33,
      emotional_energy_level: 8
    };

    const result = await createWellBeingEntry(decimalInput);

    expect(result.sleep_hours).toEqual(6.75);
    expect(result.work_hours).toEqual(8.25);
    expect(result.social_time_hours).toEqual(1.5);
    expect(result.screen_time_hours).toEqual(3.33);
  });

  it('should handle boundary values correctly', async () => {
    const boundaryInput: CreateWellBeingEntryInput = {
      date: new Date('2024-01-17'),
      sleep_hours: 0, // Minimum value
      work_hours: 24, // Maximum value
      social_time_hours: 0,
      screen_time_hours: 24,
      emotional_energy_level: 1 // Minimum energy level
    };

    const result = await createWellBeingEntry(boundaryInput);

    expect(result.sleep_hours).toEqual(0);
    expect(result.work_hours).toEqual(24);
    expect(result.social_time_hours).toEqual(0);
    expect(result.screen_time_hours).toEqual(24);
    expect(result.emotional_energy_level).toEqual(1);
  });

  it('should handle maximum boundary values correctly', async () => {
    const maxBoundaryInput: CreateWellBeingEntryInput = {
      date: new Date('2024-01-18'),
      sleep_hours: 24,
      work_hours: 0,
      social_time_hours: 24,
      screen_time_hours: 0,
      emotional_energy_level: 10 // Maximum energy level
    };

    const result = await createWellBeingEntry(maxBoundaryInput);

    expect(result.sleep_hours).toEqual(24);
    expect(result.work_hours).toEqual(0);
    expect(result.social_time_hours).toEqual(24);
    expect(result.screen_time_hours).toEqual(0);
    expect(result.emotional_energy_level).toEqual(10);
  });

  it('should prevent duplicate entries for the same date', async () => {
    // Create first entry
    await createWellBeingEntry(testInput);

    // Try to create another entry for the same date
    const duplicateInput: CreateWellBeingEntryInput = {
      date: new Date('2024-01-15'), // Same date
      sleep_hours: 8.0,
      work_hours: 6.0,
      social_time_hours: 3.0,
      screen_time_hours: 5.0,
      emotional_energy_level: 6
    };

    await expect(createWellBeingEntry(duplicateInput)).rejects.toThrow(/already exists for date/i);
  });

  it('should allow entries for different dates', async () => {
    // Create first entry
    const result1 = await createWellBeingEntry(testInput);

    // Create entry for different date
    const differentDateInput: CreateWellBeingEntryInput = {
      date: new Date('2024-01-16'), // Different date
      sleep_hours: 8.0,
      work_hours: 6.0,
      social_time_hours: 3.0,
      screen_time_hours: 5.0,
      emotional_energy_level: 6
    };

    const result2 = await createWellBeingEntry(differentDateInput);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.date).toEqual(new Date('2024-01-15'));
    expect(result2.date).toEqual(new Date('2024-01-16'));

    // Verify both entries exist in database
    const allEntries = await db.select()
      .from(wellBeingEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });

  it('should handle dates correctly across different formats', async () => {
    const dateInput: CreateWellBeingEntryInput = {
      date: new Date('2024-12-31T23:59:59.999Z'), // Date with time component
      sleep_hours: 7.0,
      work_hours: 8.0,
      social_time_hours: 2.0,
      screen_time_hours: 4.0,
      emotional_energy_level: 5
    };

    const result = await createWellBeingEntry(dateInput);

    // Should normalize to date only
    expect(result.date).toEqual(new Date('2024-12-31'));

    // Verify in database
    const entries = await db.select()
      .from(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, result.id))
      .execute();

    expect(entries[0].date).toEqual('2024-12-31');
  });
});
