import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { getCounter } from '../handlers/get_counter';

describe('getCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a counter by id', async () => {
    // Create a test counter
    const insertResult = await db.insert(countersTable)
      .values({
        count: 5
      })
      .returning()
      .execute();

    const createdCounter = insertResult[0];

    // Retrieve the counter using the handler
    const result = await getCounter(createdCounter.id);

    // Validate the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdCounter.id);
    expect(result!.count).toEqual(5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toEqual(createdCounter.created_at);
    expect(result!.updated_at).toEqual(createdCounter.updated_at);
  });

  it('should return null for non-existent counter', async () => {
    // Try to retrieve a counter that doesn't exist
    const result = await getCounter(999);

    expect(result).toBeNull();
  });

  it('should retrieve counter with default count value', async () => {
    // Create a counter without specifying count (should use default value of 0)
    const insertResult = await db.insert(countersTable)
      .values({})
      .returning()
      .execute();

    const createdCounter = insertResult[0];

    // Retrieve the counter
    const result = await getCounter(createdCounter.id);

    expect(result).toBeDefined();
    expect(result!.count).toEqual(0); // Should have default value
    expect(result!.id).toEqual(createdCounter.id);
  });

  it('should retrieve counter with large count value', async () => {
    // Test with a large count value
    const largeCount = 999999;
    const insertResult = await db.insert(countersTable)
      .values({
        count: largeCount
      })
      .returning()
      .execute();

    const createdCounter = insertResult[0];

    // Retrieve the counter
    const result = await getCounter(createdCounter.id);

    expect(result).toBeDefined();
    expect(result!.count).toEqual(largeCount);
    expect(result!.id).toEqual(createdCounter.id);
  });

  it('should handle multiple counters correctly', async () => {
    // Create multiple counters
    const counter1Result = await db.insert(countersTable)
      .values({ count: 10 })
      .returning()
      .execute();

    const counter2Result = await db.insert(countersTable)
      .values({ count: 20 })
      .returning()
      .execute();

    const counter1 = counter1Result[0];
    const counter2 = counter2Result[0];

    // Retrieve each counter and verify correct data
    const result1 = await getCounter(counter1.id);
    const result2 = await getCounter(counter2.id);

    expect(result1).toBeDefined();
    expect(result1!.count).toEqual(10);
    expect(result1!.id).toEqual(counter1.id);

    expect(result2).toBeDefined();
    expect(result2!.count).toEqual(20);
    expect(result2!.id).toEqual(counter2.id);

    // Ensure they are different counters
    expect(result1!.id).not.toEqual(result2!.id);
  });
});
