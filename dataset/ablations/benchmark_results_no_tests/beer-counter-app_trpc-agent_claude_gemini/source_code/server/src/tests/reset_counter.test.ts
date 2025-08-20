import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type ResetCounterInput } from '../schema';
import { resetCounter } from '../handlers/reset_counter';
import { eq } from 'drizzle-orm';

describe('resetCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reset counter to zero', async () => {
    // Create a counter with a non-zero count
    const createResult = await db.insert(countersTable)
      .values({
        count: 42
      })
      .returning()
      .execute();

    const counterId = createResult[0].id;
    const testInput: ResetCounterInput = {
      id: counterId
    };

    const result = await resetCounter(testInput);

    // Verify the result
    expect(result.id).toEqual(counterId);
    expect(result.count).toEqual(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at has been updated (should be more recent than created_at)
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should save reset counter to database', async () => {
    // Create a counter with a high count
    const createResult = await db.insert(countersTable)
      .values({
        count: 999
      })
      .returning()
      .execute();

    const counterId = createResult[0].id;
    const testInput: ResetCounterInput = {
      id: counterId
    };

    await resetCounter(testInput);

    // Query the database to verify the reset was saved
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, counterId))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toEqual(0);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reset already zero counter without error', async () => {
    // Create a counter that's already at zero
    const createResult = await db.insert(countersTable)
      .values({
        count: 0
      })
      .returning()
      .execute();

    const counterId = createResult[0].id;
    const testInput: ResetCounterInput = {
      id: counterId
    };

    const result = await resetCounter(testInput);

    // Should still work and return the counter
    expect(result.id).toEqual(counterId);
    expect(result.count).toEqual(0);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp when resetting counter', async () => {
    // Create a counter first
    const createResult = await db.insert(countersTable)
      .values({
        count: 25
      })
      .returning()
      .execute();

    const counterId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const testInput: ResetCounterInput = {
      id: counterId
    };

    const result = await resetCounter(testInput);

    // Verify timestamp was updated
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.count).toEqual(0);
  });

  it('should throw error for non-existent counter', async () => {
    const testInput: ResetCounterInput = {
      id: 99999 // Non-existent ID
    };

    await expect(resetCounter(testInput))
      .rejects
      .toThrow(/Counter with id 99999 not found/i);
  });

  it('should preserve created_at timestamp when resetting', async () => {
    // Create a counter
    const createResult = await db.insert(countersTable)
      .values({
        count: 15
      })
      .returning()
      .execute();

    const counterId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;

    const testInput: ResetCounterInput = {
      id: counterId
    };

    const result = await resetCounter(testInput);

    // Verify created_at is preserved
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(result.count).toEqual(0);
  });

  it('should handle multiple counter resets correctly', async () => {
    // Create multiple counters
    const counter1Result = await db.insert(countersTable)
      .values({ count: 10 })
      .returning()
      .execute();

    const counter2Result = await db.insert(countersTable)
      .values({ count: 20 })
      .returning()
      .execute();

    const counter1Id = counter1Result[0].id;
    const counter2Id = counter2Result[0].id;

    // Reset first counter
    const reset1Input: ResetCounterInput = { id: counter1Id };
    const result1 = await resetCounter(reset1Input);

    // Reset second counter
    const reset2Input: ResetCounterInput = { id: counter2Id };
    const result2 = await resetCounter(reset2Input);

    // Verify both are reset correctly
    expect(result1.count).toEqual(0);
    expect(result2.count).toEqual(0);
    expect(result1.id).toEqual(counter1Id);
    expect(result2.id).toEqual(counter2Id);

    // Verify in database
    const allCounters = await db.select()
      .from(countersTable)
      .execute();

    const resetCounters = allCounters.filter(c => c.count === 0);
    expect(resetCounters).toHaveLength(2);
  });
});
