import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq, and } from 'drizzle-orm';

// Test input with optimal wellness metrics
const testInput: CreateWellnessEntryInput = {
  user_id: 'user-123',
  date: '2024-01-15',
  sleep_hours: 8.5,
  stress_level: 3,
  caffeine_intake: 150,
  alcohol_intake: 1
};

// Test input with poor wellness metrics
const poorWellnessInput: CreateWellnessEntryInput = {
  user_id: 'user-456',
  date: '2024-01-16',
  sleep_hours: 4.0,
  stress_level: 9,
  caffeine_intake: 500,
  alcohol_intake: 5
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry with correct data', async () => {
    const result = await createWellnessEntry(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user-123');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.sleep_hours).toEqual(8.5);
    expect(result.stress_level).toEqual(3);
    expect(result.caffeine_intake).toEqual(150);
    expect(result.alcohol_intake).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.sleep_hours).toBe('number');
    expect(typeof result.wellness_score).toBe('number');
  });

  it('should calculate wellness score correctly for optimal metrics', async () => {
    const result = await createWellnessEntry(testInput);

    // Expected score calculation:
    // Sleep (8.5 hrs, optimal): 30 points
    // Stress (level 3): 30 - (3-1) * 3.33 = 23.34 points
    // Caffeine (150mg, moderate): 15 points
    // Alcohol (1 unit, moderate): 15 points
    // Total: 30 + 23.34 + 15 + 15 = 83.34 points
    expect(result.wellness_score).toBeCloseTo(83.34, 2);
  });

  it('should calculate wellness score correctly for poor metrics', async () => {
    const result = await createWellnessEntry(poorWellnessInput);

    // Expected score calculation:
    // Sleep (4 hrs, poor): 5 points
    // Stress (level 9): 30 - (9-1) * 3.33 = 3.36 points
    // Caffeine (500mg, excessive): 0 points
    // Alcohol (5 units, excessive): 0 points
    // Total: 5 + 3.36 + 0 + 0 = 8.36 points
    expect(result.wellness_score).toBeCloseTo(8.36, 2);
  });

  it('should save wellness entry to database', async () => {
    const result = await createWellnessEntry(testInput);

    // Query database to verify entry was saved
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const savedEntry = entries[0];
    
    expect(savedEntry.user_id).toEqual('user-123');
    expect(savedEntry.date).toEqual('2024-01-15');
    expect(parseFloat(savedEntry.sleep_hours)).toEqual(8.5);
    expect(savedEntry.stress_level).toEqual(3);
    expect(savedEntry.caffeine_intake).toEqual(150);
    expect(savedEntry.alcohol_intake).toEqual(1);
    expect(parseFloat(savedEntry.wellness_score)).toBeCloseTo(83.34, 2);
    expect(savedEntry.created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate entries for same user and date', async () => {
    // Create first entry
    await createWellnessEntry(testInput);

    // Attempt to create duplicate entry
    const duplicateInput: CreateWellnessEntryInput = {
      ...testInput,
      sleep_hours: 7.0, // Different values but same user and date
      stress_level: 5
    };

    await expect(createWellnessEntry(duplicateInput))
      .rejects.toThrow(/wellness entry already exists/i);
  });

  it('should allow different users to have entries on same date', async () => {
    // Create entry for first user
    await createWellnessEntry(testInput);

    // Create entry for different user on same date
    const differentUserInput: CreateWellnessEntryInput = {
      ...testInput,
      user_id: 'user-different'
    };

    const result = await createWellnessEntry(differentUserInput);

    expect(result.user_id).toEqual('user-different');
    expect(result.date).toEqual(new Date('2024-01-15'));
  });

  it('should allow same user to have entries on different dates', async () => {
    // Create entry for first date
    await createWellnessEntry(testInput);

    // Create entry for same user on different date
    const differentDateInput: CreateWellnessEntryInput = {
      ...testInput,
      date: '2024-01-16'
    };

    const result = await createWellnessEntry(differentDateInput);

    expect(result.user_id).toEqual('user-123');
    expect(result.date).toEqual(new Date('2024-01-16'));
  });

  it('should handle edge case wellness score calculations', async () => {
    // Test perfect wellness metrics
    const perfectInput: CreateWellnessEntryInput = {
      user_id: 'perfect-user',
      date: '2024-01-20',
      sleep_hours: 8.0, // Optimal
      stress_level: 1,  // Lowest stress
      caffeine_intake: 50, // Low caffeine
      alcohol_intake: 0 // No alcohol
    };

    const result = await createWellnessEntry(perfectInput);

    // Expected perfect score:
    // Sleep (8 hrs): 30 points
    // Stress (level 1): 30 points
    // Caffeine (50mg): 20 points
    // Alcohol (0 units): 20 points
    // Total: 100 points
    expect(result.wellness_score).toBe(100);
  });

  it('should handle decimal sleep hours correctly', async () => {
    const decimalSleepInput: CreateWellnessEntryInput = {
      user_id: 'decimal-user',
      date: '2024-01-21',
      sleep_hours: 7.25,
      stress_level: 4,
      caffeine_intake: 100,
      alcohol_intake: 0
    };

    const result = await createWellnessEntry(decimalSleepInput);

    expect(result.sleep_hours).toEqual(7.25);
    expect(typeof result.sleep_hours).toBe('number');
    
    // Verify it was stored and retrieved correctly from database
    const dbEntry = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(parseFloat(dbEntry[0].sleep_hours)).toEqual(7.25);
  });

  it('should verify database constraints are enforced', async () => {
    // Verify the database query structure works with multiple conditions
    await createWellnessEntry(testInput);
    
    // Test querying with multiple conditions
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(
        and(
          eq(wellnessEntriesTable.user_id, 'user-123'),
          eq(wellnessEntriesTable.date, '2024-01-15')
        )
      )
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toEqual('user-123');
    expect(entries[0].date).toEqual('2024-01-15');
  });
});
