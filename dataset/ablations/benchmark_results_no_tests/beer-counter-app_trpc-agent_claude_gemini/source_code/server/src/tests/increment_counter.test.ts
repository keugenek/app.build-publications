import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type IncrementCounterInput } from '../schema';
import { incrementCounter } from '../handlers/increment_counter';
import { eq } from 'drizzle-orm';

describe('incrementCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should increment a counter by default amount (1)', async () => {
    // Create a test counter first
    const insertResult = await db.insert(countersTable)
      .values({
        count: 5
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 1 // Default amount
    };

    const result = await incrementCounter(input);

    // Verify the increment worked correctly
    expect(result.id).toBe(testCounterId);
    expect(result.count).toBe(6); // 5 + 1
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should increment a counter by custom amount', async () => {
    // Create a test counter
    const insertResult = await db.insert(countersTable)
      .values({
        count: 10
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 5
    };

    const result = await incrementCounter(input);

    expect(result.id).toBe(testCounterId);
    expect(result.count).toBe(15); // 10 + 5
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should increment a counter from zero', async () => {
    // Create a counter starting at 0
    const insertResult = await db.insert(countersTable)
      .values({
        count: 0
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 3
    };

    const result = await incrementCounter(input);

    expect(result.count).toBe(3); // 0 + 3
    expect(result.id).toBe(testCounterId);
  });

  it('should save incremented counter to database', async () => {
    // Create a test counter
    const insertResult = await db.insert(countersTable)
      .values({
        count: 7
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 2
    };

    await incrementCounter(input);

    // Verify the counter was actually updated in the database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, testCounterId))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toBe(9); // 7 + 2
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a test counter
    const insertResult = await db.insert(countersTable)
      .values({
        count: 1
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;
    const originalUpdatedAt = insertResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 1
    };

    const result = await incrementCounter(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when counter does not exist', async () => {
    const input: IncrementCounterInput = {
      id: 99999, // Non-existent ID
      amount: 1
    };

    await expect(incrementCounter(input)).rejects.toThrow(/Counter with id 99999 not found/i);
  });

  it('should handle large increment amounts', async () => {
    // Create a test counter
    const insertResult = await db.insert(countersTable)
      .values({
        count: 100
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 1000
    };

    const result = await incrementCounter(input);

    expect(result.count).toBe(1100); // 100 + 1000
    expect(result.id).toBe(testCounterId);
  });

  it('should preserve other counter fields during increment', async () => {
    // Create a test counter
    const insertResult = await db.insert(countersTable)
      .values({
        count: 42
      })
      .returning()
      .execute();

    const testCounterId = insertResult[0].id;
    const originalCreatedAt = insertResult[0].created_at;

    const input: IncrementCounterInput = {
      id: testCounterId,
      amount: 8
    };

    const result = await incrementCounter(input);

    // Verify that created_at is preserved while updated_at changes
    expect(result.id).toBe(testCounterId);
    expect(result.count).toBe(50); // 42 + 8
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(originalCreatedAt.getTime());
  });
});
