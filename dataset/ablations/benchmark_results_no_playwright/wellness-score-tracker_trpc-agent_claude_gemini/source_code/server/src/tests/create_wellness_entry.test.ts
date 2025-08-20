import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq, and } from 'drizzle-orm';

// Test input with optimal wellness values
const optimalInput: CreateWellnessEntryInput = {
  user_id: 1,
  date: new Date('2023-10-15'),
  hours_of_sleep: 8,
  stress_level: 1,
  caffeine_intake: 200,
  alcohol_intake: 0
};

// Test input with suboptimal wellness values
const suboptimalInput: CreateWellnessEntryInput = {
  user_id: 2,
  date: new Date('2023-10-16'),
  hours_of_sleep: 5,
  stress_level: 8,
  caffeine_intake: 500,
  alcohol_intake: 3
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry with optimal values', async () => {
    const result = await createWellnessEntry(optimalInput);

    // Basic field validation
    expect(result.user_id).toEqual(1);
    expect(result.date).toEqual(new Date('2023-10-15'));
    expect(result.hours_of_sleep).toEqual(8);
    expect(result.stress_level).toEqual(1);
    expect(result.caffeine_intake).toEqual(200);
    expect(result.alcohol_intake).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Wellness score should be high for optimal values
    expect(result.wellness_score).toBeGreaterThan(95);
    expect(typeof result.wellness_score).toBe('number');
  });

  it('should create a wellness entry with suboptimal values', async () => {
    const result = await createWellnessEntry(suboptimalInput);

    // Basic field validation
    expect(result.user_id).toEqual(2);
    expect(result.date).toEqual(new Date('2023-10-16'));
    expect(result.hours_of_sleep).toEqual(5);
    expect(result.stress_level).toEqual(8);
    expect(result.caffeine_intake).toEqual(500);
    expect(result.alcohol_intake).toEqual(3);
    
    // Wellness score should be lower for suboptimal values
    expect(result.wellness_score).toBeLessThan(50);
    expect(typeof result.wellness_score).toBe('number');
  });

  it('should save wellness entry to database', async () => {
    const result = await createWellnessEntry(optimalInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.user_id).toEqual(1);
    expect(entry.date).toEqual('2023-10-15'); // Date stored as string in database
    expect(entry.hours_of_sleep).toEqual(8);
    expect(entry.stress_level).toEqual(1);
    expect(entry.caffeine_intake).toEqual(200);
    expect(entry.alcohol_intake).toEqual(0);
    expect(entry.wellness_score).toBeGreaterThan(95);
    expect(entry.created_at).toBeInstanceOf(Date);
    expect(entry.updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal values correctly', async () => {
    const decimalInput: CreateWellnessEntryInput = {
      user_id: 3,
      date: new Date('2023-10-17'),
      hours_of_sleep: 7.5,
      stress_level: 4,
      caffeine_intake: 150.5,
      alcohol_intake: 1.5
    };

    const result = await createWellnessEntry(decimalInput);

    expect(result.hours_of_sleep).toEqual(7.5);
    expect(result.caffeine_intake).toEqual(150.5);
    expect(result.alcohol_intake).toEqual(1.5);
    expect(typeof result.hours_of_sleep).toBe('number');
    expect(typeof result.caffeine_intake).toBe('number');
    expect(typeof result.alcohol_intake).toBe('number');
  });

  it('should prevent duplicate entries for same user and date', async () => {
    const uniqueInput: CreateWellnessEntryInput = {
      user_id: 10,
      date: new Date('2023-10-25'),
      hours_of_sleep: 8,
      stress_level: 1,
      caffeine_intake: 200,
      alcohol_intake: 0
    };

    // Create first entry
    await createWellnessEntry(uniqueInput);

    // Try to create duplicate entry for same user and date
    const duplicateInput: CreateWellnessEntryInput = {
      ...uniqueInput,
      hours_of_sleep: 9,
      stress_level: 2
    };

    await expect(createWellnessEntry(duplicateInput)).rejects.toThrow();
  });

  it('should allow multiple entries for different users on same date', async () => {
    // Create entry for user 1
    const result1 = await createWellnessEntry(optimalInput);

    // Create entry for user 2 on same date
    const user2Input: CreateWellnessEntryInput = {
      ...optimalInput,
      user_id: 2
    };
    const result2 = await createWellnessEntry(user2Input);

    expect(result1.user_id).toEqual(1);
    expect(result2.user_id).toEqual(2);
    expect(result1.date).toEqual(result2.date);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should allow multiple entries for same user on different dates', async () => {
    // Create entry for day 1
    const result1 = await createWellnessEntry(optimalInput);

    // Create entry for day 2
    const day2Input: CreateWellnessEntryInput = {
      ...optimalInput,
      date: new Date('2023-10-16')
    };
    const result2 = await createWellnessEntry(day2Input);

    expect(result1.user_id).toEqual(result2.user_id);
    expect(result1.date).not.toEqual(result2.date);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should calculate wellness score correctly for edge cases', async () => {
    // Test minimum sleep
    const minSleepInput: CreateWellnessEntryInput = {
      user_id: 4,
      date: new Date('2023-10-18'),
      hours_of_sleep: 0,
      stress_level: 1,
      caffeine_intake: 0,
      alcohol_intake: 0
    };

    const result1 = await createWellnessEntry(minSleepInput);
    expect(result1.wellness_score).toBeLessThan(100);

    // Test maximum stress
    const maxStressInput: CreateWellnessEntryInput = {
      user_id: 5,
      date: new Date('2023-10-19'),
      hours_of_sleep: 8,
      stress_level: 10,
      caffeine_intake: 0,
      alcohol_intake: 0
    };

    const result2 = await createWellnessEntry(maxStressInput);
    expect(result2.wellness_score).toBeLessThan(75); // Should be significantly lower due to max stress

    // Test high caffeine
    const highCaffeineInput: CreateWellnessEntryInput = {
      user_id: 6,
      date: new Date('2023-10-20'),
      hours_of_sleep: 8,
      stress_level: 1,
      caffeine_intake: 800,
      alcohol_intake: 0
    };

    const result3 = await createWellnessEntry(highCaffeineInput);
    expect(result3.wellness_score).toBeLessThan(95);
  });
});
