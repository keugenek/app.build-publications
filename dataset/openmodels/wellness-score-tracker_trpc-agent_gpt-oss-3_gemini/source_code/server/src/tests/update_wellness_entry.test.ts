import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Helper to create a wellness entry directly in DB
const createInitialEntry = async (): Promise<WellnessEntry> => {
  const [inserted] = await db
    .insert(wellnessEntriesTable)
    .values({
      sleep_hours: '7.5', // numeric stored as string
      stress_level: 3,
      caffeine_servings: 2,
      alcohol_servings: 1,
      wellness_score: '85.0',
    })
    .returning()
    .execute();
  // Convert numeric strings to numbers for consistency with schema type
  return {
    ...inserted,
    sleep_hours: parseFloat(inserted.sleep_hours as unknown as string),
    wellness_score: parseFloat(inserted.wellness_score as unknown as string),
  } as WellnessEntry;
};

describe('updateWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all provided fields and convert numeric types', async () => {
    const original = await createInitialEntry();

    const input: UpdateWellnessEntryInput = {
      id: original.id,
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_servings: 1,
      alcohol_servings: 0,
      wellness_score: 90,
    };

    const updated = await updateWellnessEntry(input);

    expect(updated.id).toBe(original.id);
    expect(updated.sleep_hours).toBe(8.0);
    expect(updated.stress_level).toBe(2);
    expect(updated.caffeine_servings).toBe(1);
    expect(updated.alcohol_servings).toBe(0);
    expect(updated.wellness_score).toBe(90);
    expect(updated.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes in the database', async () => {
    const original = await createInitialEntry();
    const input: UpdateWellnessEntryInput = {
      id: original.id,
      sleep_hours: 6.5,
      wellness_score: 70,
    };
    await updateWellnessEntry(input);

    const [dbEntry] = await db
      .select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, original.id))
      .execute();

    expect(parseFloat(dbEntry.sleep_hours as unknown as string)).toBe(6.5);
    expect(parseFloat(dbEntry.wellness_score as unknown as string)).toBe(70);
  });

  it('should only update supplied fields, leaving others unchanged', async () => {
    const original = await createInitialEntry();
    const input: UpdateWellnessEntryInput = {
      id: original.id,
      caffeine_servings: 3,
    };
    const updated = await updateWellnessEntry(input);

    expect(updated.caffeine_servings).toBe(3);
    // Unchanged fields should match original values
    expect(updated.sleep_hours).toBe(original.sleep_hours);
    expect(updated.stress_level).toBe(original.stress_level);
    expect(updated.alcohol_servings).toBe(original.alcohol_servings);
    expect(updated.wellness_score).toBe(original.wellness_score);
  });
});
