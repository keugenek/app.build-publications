import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntries } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

const testInput: CreateWellnessEntryInput = {
  // date omitted to test default handling
  sleep_hours: 7.5,
  stress_level: 3,
  caffeine_servings: 2,
  alcohol_servings: 1,
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a record and return correct types', async () => {
    const result = await createWellnessEntry(testInput);

    // Verify returned fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.sleep_hours).toBe(7.5);
    expect(result.stress_level).toBe(3);
    expect(result.caffeine_servings).toBe(2);
    expect(result.alcohol_servings).toBe(1);
    // Score calculation based on our formula
    const expectedScore = 7.5 * 2 - 3 * 3 - 2 * 1 - 1 * 2;
    expect(result.wellness_score).toBeCloseTo(expectedScore);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the entry in the database with proper numeric conversion', async () => {
    const result = await createWellnessEntry(testInput);

    const rows = await db
      .select()
      .from(wellnessEntries)
      .where(eq(wellnessEntries.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.id).toBe(result.id);
    expect(row.date).toBe(result.date);
    // numeric columns are strings from Drizzle
    expect(parseFloat(row.sleep_hours as unknown as string)).toBe(7.5);
    expect(row.stress_level).toBe(3);
    expect(row.caffeine_servings).toBe(2);
    expect(row.alcohol_servings).toBe(1);
    expect(parseFloat(row.wellness_score as unknown as string)).toBeCloseTo(
      7.5 * 2 - 3 * 3 - 2 * 1 - 1 * 2
    );
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
