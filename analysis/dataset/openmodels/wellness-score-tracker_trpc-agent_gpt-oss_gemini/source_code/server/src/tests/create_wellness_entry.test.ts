import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntries } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

const testInput: CreateWellnessEntryInput = {
  entry_date: new Date('2023-01-01T10:00:00Z'),
  sleep_hours: 7.5,
  stress_level: 4,
  caffeine_intake: 150,
  alcohol_intake: 20
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates an entry with correct values and numeric conversions', async () => {
    const result = await createWellnessEntry(testInput);

    // Basic field checks
    expect(result.id).toBeGreaterThan(0);
    expect(result.entry_date.getTime()).toBe(testInput.entry_date!.getTime());
    expect(result.sleep_hours).toBeCloseTo(testInput.sleep_hours);
    expect(result.stress_level).toBe(testInput.stress_level);
    expect(result.caffeine_intake).toBeCloseTo(testInput.caffeine_intake);
    expect(result.alcohol_intake).toBeCloseTo(testInput.alcohol_intake);
    // Wellness score should be numeric
    expect(typeof result.wellness_score).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('persists the entry to the database with proper numeric storage', async () => {
    const result = await createWellnessEntry(testInput);

    const rows = await db
      .select()
      .from(wellnessEntries)
      .where(eq(wellnessEntries.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    // Numeric columns are stored as strings; verify conversion matches input
    expect(parseFloat(row.sleep_hours)).toBeCloseTo(testInput.sleep_hours);
    expect(row.stress_level).toBe(testInput.stress_level);
    expect(parseFloat(row.caffeine_intake)).toBeCloseTo(testInput.caffeine_intake);
    expect(parseFloat(row.alcohol_intake)).toBeCloseTo(testInput.alcohol_intake);
    expect(parseFloat(row.wellness_score)).toBeCloseTo(result.wellness_score);
  });

  it('defaults entry_date to now when omitted', async () => {
    const { entry_date, ...rest } = testInput;
    const result = await createWellnessEntry(rest);
    const now = Date.now();
    // Result date should be within a reasonable window (e.g., 5 seconds)
    expect(Math.abs(result.entry_date.getTime() - now)).toBeLessThanOrEqual(5000);
  });
});
