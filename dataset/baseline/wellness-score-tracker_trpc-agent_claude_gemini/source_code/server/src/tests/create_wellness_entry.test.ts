import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

// Test input with optimal wellness values
const optimalInput: CreateWellnessEntryInput = {
  sleep_hours: 8,
  stress_level: 2,
  caffeine_intake: 100,
  alcohol_intake: 0,
  entry_date: '2024-01-15'
};

// Test input with poor wellness values
const poorInput: CreateWellnessEntryInput = {
  sleep_hours: 4,
  stress_level: 9,
  caffeine_intake: 500,
  alcohol_intake: 5,
  entry_date: '2024-01-16'
};

// Test input with moderate wellness values
const moderateInput: CreateWellnessEntryInput = {
  sleep_hours: 6.5,
  stress_level: 5,
  caffeine_intake: 250,
  alcohol_intake: 2,
  entry_date: '2024-01-17'
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry with optimal values', async () => {
    const result = await createWellnessEntry(optimalInput);

    // Basic field validation
    expect(result.sleep_hours).toEqual(8);
    expect(result.stress_level).toEqual(2);
    expect(result.caffeine_intake).toEqual(100);
    expect(result.alcohol_intake).toEqual(0);
    expect(result.entry_date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify wellness score is calculated correctly for optimal values
    expect(result.wellness_score).toBeGreaterThan(80); // Should be high for optimal values
    expect(typeof result.wellness_score).toBe('number');
  });

  it('should create a wellness entry with poor values and lower score', async () => {
    const result = await createWellnessEntry(poorInput);

    // Basic field validation
    expect(result.sleep_hours).toEqual(4);
    expect(result.stress_level).toEqual(9);
    expect(result.caffeine_intake).toEqual(500);
    expect(result.alcohol_intake).toEqual(5);
    expect(result.entry_date).toEqual(new Date('2024-01-16T00:00:00.000Z'));
    
    // Verify wellness score is lower for poor values
    expect(result.wellness_score).toBeLessThan(35); // Should be low for poor values
    expect(typeof result.wellness_score).toBe('number');
  });

  it('should save wellness entry to database correctly', async () => {
    const result = await createWellnessEntry(moderateInput);

    // Query database using proper drizzle syntax
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    
    // Verify database storage (numeric fields are stored as strings)
    expect(parseFloat(entry.sleep_hours)).toEqual(6.5);
    expect(entry.stress_level).toEqual(5);
    expect(parseFloat(entry.caffeine_intake)).toEqual(250);
    expect(parseFloat(entry.alcohol_intake)).toEqual(2);
    expect(entry.entry_date).toEqual('2024-01-17');
    expect(entry.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal sleep hours correctly', async () => {
    const decimalInput: CreateWellnessEntryInput = {
      sleep_hours: 7.5,
      stress_level: 3,
      caffeine_intake: 150,
      alcohol_intake: 1,
      entry_date: '2024-01-18'
    };

    const result = await createWellnessEntry(decimalInput);

    expect(result.sleep_hours).toEqual(7.5);
    expect(typeof result.sleep_hours).toBe('number');
    
    // Verify precision is maintained in database
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(parseFloat(entries[0].sleep_hours)).toEqual(7.5);
  });

  it('should calculate wellness score within valid range (0-100)', async () => {
    const extremeInput: CreateWellnessEntryInput = {
      sleep_hours: 24, // Extreme value
      stress_level: 10, // Maximum stress
      caffeine_intake: 1000, // Very high caffeine
      alcohol_intake: 10, // High alcohol
      entry_date: '2024-01-19'
    };

    const result = await createWellnessEntry(extremeInput);

    expect(result.wellness_score).toBeGreaterThanOrEqual(0);
    expect(result.wellness_score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.wellness_score)).toBe(true); // Should be rounded integer
  });

  it('should handle zero values correctly', async () => {
    const zeroInput: CreateWellnessEntryInput = {
      sleep_hours: 0,
      stress_level: 1, // Minimum valid stress level
      caffeine_intake: 0,
      alcohol_intake: 0,
      entry_date: '2024-01-20'
    };

    const result = await createWellnessEntry(zeroInput);

    expect(result.sleep_hours).toEqual(0);
    expect(result.caffeine_intake).toEqual(0);
    expect(result.alcohol_intake).toEqual(0);
    expect(result.wellness_score).toBeGreaterThanOrEqual(0);
  });

  it('should create multiple entries on different dates', async () => {
    const entry1 = await createWellnessEntry(optimalInput);
    const entry2 = await createWellnessEntry(poorInput);

    expect(entry1.id).not.toEqual(entry2.id);
    expect(entry1.entry_date).not.toEqual(entry2.entry_date);
    
    // Verify both entries exist in database
    const allEntries = await db.select()
      .from(wellnessEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });

  it('should handle high precision numeric values', async () => {
    const precisionInput: CreateWellnessEntryInput = {
      sleep_hours: 7.75,
      stress_level: 4,
      caffeine_intake: 125.5,
      alcohol_intake: 1.25,
      entry_date: '2024-01-21'
    };

    const result = await createWellnessEntry(precisionInput);

    expect(result.sleep_hours).toEqual(7.75);
    expect(result.caffeine_intake).toEqual(125.5);
    expect(result.alcohol_intake).toEqual(1.25);
    
    // Verify precision is maintained in database
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(parseFloat(entries[0].sleep_hours)).toEqual(7.75);
    expect(parseFloat(entries[0].caffeine_intake)).toEqual(125.5);
    expect(parseFloat(entries[0].alcohol_intake)).toEqual(1.25);
  });
});
