import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateWellnessEntryInput = {
  sleep_hours: 7.5,
  stress_level: 6,
  caffeine_intake: 2,
  alcohol_intake: 1,
  user_id: 'user-123'
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry', async () => {
    const result = await createWellnessEntry(testInput);

    // Basic field validation
    expect(result.sleep_hours).toEqual(7.5);
    expect(result.stress_level).toEqual(6);
    expect(result.caffeine_intake).toEqual(2);
    expect(result.alcohol_intake).toEqual(1);
    expect(result.user_id).toEqual('user-123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.wellness_score).toEqual('number');
  });

  it('should save wellness entry to database', async () => {
    const result = await createWellnessEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(parseFloat(entries[0].sleep_hours)).toEqual(7.5);
    expect(entries[0].stress_level).toEqual(6);
    expect(entries[0].caffeine_intake).toEqual(2);
    expect(entries[0].alcohol_intake).toEqual(1);
    expect(entries[0].user_id).toEqual('user-123');
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(typeof parseFloat(entries[0].wellness_score)).toEqual('number');
  });

  it('should calculate wellness score correctly', async () => {
    const result = await createWellnessEntry(testInput);
    
    // Based on our calculation formula:
    // Base score: 50
    // Sleep points: (7.5 - 8) * 2 = -1
    // Stress penalty: (6 - 5) * 3 = 3
    // Substance penalty: (2 + 1) * 1.5 = 4.5
    // Total: 50 - 1 - 3 - 4.5 = 41.5
    
    expect(result.wellness_score).toEqual(41.5);
  });
});
