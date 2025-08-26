import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type UpdateCounterInput } from '../schema';
import { updateCounter } from '../handlers/update_counter';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: UpdateCounterInput = {
  id: 1,
  count: 5
};

describe('updateCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new counter when it does not exist', async () => {
    const result = await updateCounter(testInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.count).toEqual(5);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save new counter to database', async () => {
    const result = await updateCounter(testInput);

    // Query using proper drizzle syntax
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].id).toEqual(1);
    expect(counters[0].count).toEqual(5);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update an existing counter', async () => {
    // First create a counter
    const initialResult = await updateCounter(testInput);
    
    // Update the same counter with a new count
    const updateInput: UpdateCounterInput = {
      id: 1,
      count: 10
    };
    
    const result = await updateCounter(updateInput);

    // Validate the updated values
    expect(result.id).toEqual(1);
    expect(result.count).toEqual(10);
    expect(result.updated_at).toBeInstanceOf(Date);
    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(initialResult.updated_at.getTime());
  });

  it('should save updated counter to database', async () => {
    // First create a counter
    await updateCounter(testInput);
    
    // Update the counter
    const updateInput: UpdateCounterInput = {
      id: 1,
      count: 15
    };
    
    await updateCounter(updateInput);

    // Query the database to verify the update was saved
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, 1))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].id).toEqual(1);
    expect(counters[0].count).toEqual(15);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });
});
