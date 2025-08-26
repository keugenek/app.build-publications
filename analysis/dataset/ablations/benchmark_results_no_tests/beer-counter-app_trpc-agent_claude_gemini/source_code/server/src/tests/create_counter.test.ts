import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type CreateCounterInput } from '../schema';
import { createCounter } from '../handlers/create_counter';
import { eq } from 'drizzle-orm';

// Test input with explicit count
const testInputWithCount: CreateCounterInput = {
  count: 5
};

// Test input that will use default (0)
const testInputDefault: CreateCounterInput = {
  count: 0
};

describe('createCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a counter with specified count', async () => {
    const result = await createCounter(testInputWithCount);

    // Basic field validation
    expect(result.count).toEqual(5);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a counter with default count of 0', async () => {
    const result = await createCounter(testInputDefault);

    // Verify default count is applied
    expect(result.count).toEqual(0);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save counter to database correctly', async () => {
    const result = await createCounter(testInputWithCount);

    // Query the database to verify persistence
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toEqual(5);
    expect(counters[0].id).toEqual(result.id);
    expect(counters[0].created_at).toBeInstanceOf(Date);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple counters with unique ids', async () => {
    const result1 = await createCounter({ count: 10 });
    const result2 = await createCounter({ count: 20 });

    // Verify both counters exist with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.count).toEqual(10);
    expect(result2.count).toEqual(20);

    // Verify both are in database
    const allCounters = await db.select()
      .from(countersTable)
      .execute();

    expect(allCounters).toHaveLength(2);
    
    const counter1 = allCounters.find(c => c.id === result1.id);
    const counter2 = allCounters.find(c => c.id === result2.id);
    
    expect(counter1?.count).toEqual(10);
    expect(counter2?.count).toEqual(20);
  });

  it('should handle zero count correctly', async () => {
    const result = await createCounter({ count: 0 });

    expect(result.count).toEqual(0);
    expect(result.id).toBeDefined();

    // Verify in database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters[0].count).toEqual(0);
  });

  it('should handle large count values', async () => {
    const largeCount = 999999;
    const result = await createCounter({ count: largeCount });

    expect(result.count).toEqual(largeCount);
    expect(result.id).toBeDefined();

    // Verify in database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters[0].count).toEqual(largeCount);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createCounter(testInputWithCount);
    const afterCreation = new Date();

    // Check that timestamps are within reasonable range
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
    expect(result.updated_at >= beforeCreation).toBe(true);
    expect(result.updated_at <= afterCreation).toBe(true);

    // Verify timestamps are properly set in database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters[0].created_at).toBeInstanceOf(Date);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
    expect(counters[0].created_at >= beforeCreation).toBe(true);
    expect(counters[0].updated_at >= beforeCreation).toBe(true);
  });
});
