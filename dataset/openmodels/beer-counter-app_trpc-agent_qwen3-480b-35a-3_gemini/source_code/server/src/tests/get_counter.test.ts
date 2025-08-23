import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getCounter, updateCounter } from '../handlers/get_counter';
import { type UpdateCounterInput } from '../schema';

describe('getCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new counter with default values if it does not exist', async () => {
    const id = 1;
    const result = await getCounter(id);

    expect(result.id).toEqual(id);
    expect(result.count).toEqual(0);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return an existing counter if it exists', async () => {
    const id = 1;
    
    // Create a counter first
    const [createdCounter] = await db.insert(countersTable)
      .values({ id, count: 5 })
      .returning();
    
    const result = await getCounter(id);

    expect(result.id).toEqual(createdCounter.id);
    expect(result.count).toEqual(createdCounter.count);
    expect(result.updated_at).toEqual(createdCounter.updated_at);
  });

  it('should save counter to database', async () => {
    const id = 1;
    const result = await getCounter(id);

    // Query using proper drizzle syntax
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].id).toEqual(id);
    expect(counters[0].count).toEqual(0);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });
});

describe('updateCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing counter', async () => {
    // First create a counter
    const [createdCounter] = await db.insert(countersTable)
      .values({ id: 1, count: 5 })
      .returning();
    
    const testInput: UpdateCounterInput = {
      id: 1,
      count: 10
    };
    
    const result = await updateCounter(testInput);
    
    // Basic field validation
    expect(result.id).toEqual(testInput.id);
    expect(result.count).toEqual(testInput.count);
    expect(result.updated_at).toBeInstanceOf(Date);
    // Updated at should be more recent than the created time
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(createdCounter.updated_at.getTime());
  });

  it('should save updated counter to database', async () => {
    // First create a counter
    await db.insert(countersTable)
      .values({ id: 1, count: 5 })
      .returning();
    
    const testInput: UpdateCounterInput = {
      id: 1,
      count: 10
    };
    
    const result = await updateCounter(testInput);

    // Query using proper drizzle syntax
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].id).toEqual(testInput.id);
    expect(counters[0].count).toEqual(testInput.count);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non-existent counter', async () => {
    const testInput: UpdateCounterInput = {
      id: 1,
      count: 10
    };
    
    // Try to update a counter that doesn't exist
    await expect(updateCounter(testInput)).rejects.toThrow(/Counter with id 1 not found/);
  });
});
