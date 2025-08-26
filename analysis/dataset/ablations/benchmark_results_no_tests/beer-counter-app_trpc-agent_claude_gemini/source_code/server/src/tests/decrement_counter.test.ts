import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type DecrementCounterInput } from '../schema';
import { decrementCounter } from '../handlers/decrement_counter';
import { eq } from 'drizzle-orm';

describe('decrementCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should decrement a counter by default amount (1)', async () => {
    // Create a counter with initial count of 5
    const initialCounter = await db.insert(countersTable)
      .values({ count: 5 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 1 // This is the default, but being explicit
    };

    const result = await decrementCounter(input);

    expect(result.id).toBe(initialCounter[0].id);
    expect(result.count).toBe(4); // 5 - 1 = 4
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should decrement a counter by specified amount', async () => {
    // Create a counter with initial count of 10
    const initialCounter = await db.insert(countersTable)
      .values({ count: 10 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 3
    };

    const result = await decrementCounter(input);

    expect(result.id).toBe(initialCounter[0].id);
    expect(result.count).toBe(7); // 10 - 3 = 7
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should not allow count to go below zero', async () => {
    // Create a counter with initial count of 2
    const initialCounter = await db.insert(countersTable)
      .values({ count: 2 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 5 // Trying to decrement by more than current count
    };

    const result = await decrementCounter(input);

    expect(result.id).toBe(initialCounter[0].id);
    expect(result.count).toBe(0); // Should be 0, not negative
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle decrementing from zero', async () => {
    // Create a counter with initial count of 0
    const initialCounter = await db.insert(countersTable)
      .values({ count: 0 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 1
    };

    const result = await decrementCounter(input);

    expect(result.id).toBe(initialCounter[0].id);
    expect(result.count).toBe(0); // Should remain 0
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the database record', async () => {
    // Create a counter with initial count of 8
    const initialCounter = await db.insert(countersTable)
      .values({ count: 8 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 2
    };

    await decrementCounter(input);

    // Verify the database was actually updated
    const updatedCounters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, initialCounter[0].id))
      .execute();

    expect(updatedCounters).toHaveLength(1);
    expect(updatedCounters[0].count).toBe(6); // 8 - 2 = 6
    expect(updatedCounters[0].updated_at).toBeInstanceOf(Date);
    expect(updatedCounters[0].updated_at.getTime()).toBeGreaterThan(initialCounter[0].updated_at.getTime());
  });

  it('should throw error when counter does not exist', async () => {
    const input: DecrementCounterInput = {
      id: 999, // Non-existent ID
      amount: 1
    };

    await expect(decrementCounter(input)).rejects.toThrow(/Counter with id 999 not found/i);
  });

  it('should handle large decrement amounts correctly', async () => {
    // Create a counter with initial count of 100
    const initialCounter = await db.insert(countersTable)
      .values({ count: 100 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 25
    };

    const result = await decrementCounter(input);

    expect(result.id).toBe(initialCounter[0].id);
    expect(result.count).toBe(75); // 100 - 25 = 75
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve other counter fields', async () => {
    // Create a counter
    const initialCounter = await db.insert(countersTable)
      .values({ count: 15 })
      .returning()
      .execute();

    const input: DecrementCounterInput = {
      id: initialCounter[0].id,
      amount: 3
    };

    const result = await decrementCounter(input);

    // Verify all fields are preserved correctly
    expect(result.id).toBe(initialCounter[0].id);
    expect(result.count).toBe(12); // 15 - 3 = 12
    expect(result.created_at).toEqual(initialCounter[0].created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialCounter[0].created_at.getTime());
  });
});
