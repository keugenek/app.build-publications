import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

// Sample input without optional wellness_score
const baseInput: CreateWellnessEntryInput = {
  sleep_hours: 7.5,
  stress_level: 3,
  caffeine_servings: 2,
  alcohol_servings: 1,
};

// Sample input with wellness_score provided
const scoredInput: CreateWellnessEntryInput = {
  ...baseInput,
  wellness_score: 85,
};

describe('createWellnessEntry handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a new wellness entry with default wellness_score', async () => {
    const result = await createWellnessEntry(baseInput);

    // Verify returned object shape and types
    expect(result.id).toBeGreaterThan(0);
    expect(typeof result.sleep_hours).toBe('number');
    expect(result.sleep_hours).toBeCloseTo(7.5);
    expect(result.stress_level).toBe(3);
    expect(result.caffeine_servings).toBe(2);
    expect(result.alcohol_servings).toBe(1);
    expect(result.wellness_score).toBe(0); // default when omitted
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the entry in the database', async () => {
    const created = await createWellnessEntry(baseInput);
    const rows = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(parseFloat(row.sleep_hours)).toBeCloseTo(7.5);
    expect(row.stress_level).toBe(3);
    expect(row.caffeine_servings).toBe(2);
    expect(row.alcohol_servings).toBe(1);
    expect(parseFloat(row.wellness_score)).toBe(0);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('should respect a provided wellness_score', async () => {
    const result = await createWellnessEntry(scoredInput);
    expect(result.wellness_score).toBeCloseTo(85);

    const row = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();
    expect(row).toHaveLength(1);
    expect(parseFloat(row[0].wellness_score)).toBeCloseTo(85);
  });
});
