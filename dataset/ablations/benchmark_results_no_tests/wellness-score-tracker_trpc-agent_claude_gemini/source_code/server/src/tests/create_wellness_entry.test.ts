import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq, and, gte, lte } from 'drizzle-orm';

// Test input with optimal wellness values
const testInput: CreateWellnessEntryInput = {
  user_id: 'user-123',
  date: new Date('2023-12-01'),
  sleep_hours: 8.0,
  stress_level: 3,
  caffeine_intake: 150.5,
  alcohol_intake: 0.0
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry with calculated score', async () => {
    const result = await createWellnessEntry(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user-123');
    expect(result.date).toEqual(new Date('2023-12-01'));
    expect(result.sleep_hours).toEqual(8.0);
    expect(result.stress_level).toEqual(3);
    expect(result.caffeine_intake).toEqual(150.5);
    expect(result.alcohol_intake).toEqual(0.0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.sleep_hours).toEqual('number');
    expect(typeof result.stress_level).toEqual('number');
    expect(typeof result.caffeine_intake).toEqual('number');
    expect(typeof result.alcohol_intake).toEqual('number');
    expect(typeof result.wellness_score).toEqual('number');

    // Wellness score should be calculated and within valid range
    expect(result.wellness_score).toBeGreaterThan(0);
    expect(result.wellness_score).toBeLessThanOrEqual(100);
  });

  it('should save wellness entry to database', async () => {
    const result = await createWellnessEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.user_id).toEqual('user-123');
    expect(entry.date).toEqual('2023-12-01'); // Date stored as string in database
    expect(parseFloat(entry.sleep_hours)).toEqual(8.0);
    expect(entry.stress_level).toEqual(3);
    expect(parseFloat(entry.caffeine_intake)).toEqual(150.5);
    expect(parseFloat(entry.alcohol_intake)).toEqual(0.0);
    expect(entry.created_at).toBeInstanceOf(Date);
    expect(entry.updated_at).toBeInstanceOf(Date);
  });

  it('should calculate high wellness score for optimal inputs', async () => {
    // Optimal wellness values
    const optimalInput: CreateWellnessEntryInput = {
      user_id: 'user-456',
      date: new Date('2023-12-02'),
      sleep_hours: 8.0, // Optimal sleep
      stress_level: 2, // Low stress
      caffeine_intake: 100, // Moderate caffeine
      alcohol_intake: 0 // No alcohol
    };

    const result = await createWellnessEntry(optimalInput);

    // Should have a high wellness score (>80)
    expect(result.wellness_score).toBeGreaterThan(80);
    expect(result.wellness_score).toBeLessThanOrEqual(100);
  });

  it('should calculate lower wellness score for poor inputs', async () => {
    // Poor wellness values
    const poorInput: CreateWellnessEntryInput = {
      user_id: 'user-789',
      date: new Date('2023-12-03'),
      sleep_hours: 4.0, // Poor sleep
      stress_level: 9, // High stress
      caffeine_intake: 500, // High caffeine
      alcohol_intake: 3.0 // High alcohol
    };

    const result = await createWellnessEntry(poorInput);

    // Should have a lower wellness score
    expect(result.wellness_score).toBeLessThan(50);
    expect(result.wellness_score).toBeGreaterThanOrEqual(0);
  });

  it('should handle decimal values correctly', async () => {
    const decimalInput: CreateWellnessEntryInput = {
      user_id: 'user-decimal',
      date: new Date('2023-12-04'),
      sleep_hours: 7.75, // Decimal sleep hours
      stress_level: 5,
      caffeine_intake: 125.25, // Decimal caffeine
      alcohol_intake: 1.5 // Decimal alcohol
    };

    const result = await createWellnessEntry(decimalInput);

    // Verify decimal precision is preserved
    expect(result.sleep_hours).toEqual(7.75);
    expect(result.caffeine_intake).toEqual(125.25);
    expect(result.alcohol_intake).toEqual(1.5);
  });

  it('should handle multiple entries for same user', async () => {
    const firstEntry: CreateWellnessEntryInput = {
      user_id: 'multi-user',
      date: new Date('2023-12-01'),
      sleep_hours: 8.0,
      stress_level: 3,
      caffeine_intake: 150,
      alcohol_intake: 0
    };

    const secondEntry: CreateWellnessEntryInput = {
      user_id: 'multi-user',
      date: new Date('2023-12-02'),
      sleep_hours: 7.0,
      stress_level: 5,
      caffeine_intake: 200,
      alcohol_intake: 1.0
    };

    const result1 = await createWellnessEntry(firstEntry);
    const result2 = await createWellnessEntry(secondEntry);

    // Both entries should be created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(result2.user_id);
    expect(result1.date).not.toEqual(result2.date);

    // Query both entries from database
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.user_id, 'multi-user'))
      .execute();

    expect(entries).toHaveLength(2);
  });

  it('should query entries by date range correctly', async () => {
    // Create entries across different dates
    const dates = [
      new Date('2023-12-01'),
      new Date('2023-12-05'),
      new Date('2023-12-10')
    ];

    for (const date of dates) {
      await createWellnessEntry({
        ...testInput,
        user_id: 'date-test-user',
        date
      });
    }

    // Query entries within date range - convert dates to strings for comparison
    const startDateStr = '2023-12-03';
    const endDateStr = '2023-12-12';

    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(
        and(
          eq(wellnessEntriesTable.user_id, 'date-test-user'),
          gte(wellnessEntriesTable.date, startDateStr),
          lte(wellnessEntriesTable.date, endDateStr)
        )
      )
      .execute();

    // Should only return entries within the date range
    expect(entries).toHaveLength(2);
    entries.forEach(entry => {
      expect(entry.date >= startDateStr).toBe(true);
      expect(entry.date <= endDateStr).toBe(true);
    });
  });
});
