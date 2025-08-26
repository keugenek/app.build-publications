import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { beerCounterTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateBeerCountInput } from '../schema';
import { updateBeerCount } from '../handlers/update_beer_count';

// Test input
const testInput: UpdateBeerCountInput = {
  count: 42
};

describe('updateBeerCount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new beer counter when none exists', async () => {
    const result = await updateBeerCount(testInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.count).toEqual(42);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing beer counter', async () => {
    // First create a record
    await db.insert(beerCounterTable)
      .values({
        id: 1,
        count: 10,
      })
      .execute();
    
    // Update the count
    const updateInput: UpdateBeerCountInput = {
      count: 25
    };
    
    const result = await updateBeerCount(updateInput);

    // Validate the update
    expect(result.id).toEqual(1);
    expect(result.count).toEqual(25);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save beer counter to database', async () => {
    const result = await updateBeerCount(testInput);

    // Query the database to verify the data was saved correctly
    const counters = await db.select()
      .from(beerCounterTable)
      .where(eq(beerCounterTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].id).toEqual(1);
    expect(counters[0].count).toEqual(42);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the timestamp when updating', async () => {
    // Create initial record
    const initialResult = await updateBeerCount({ count: 10 });
    const initialTime = initialResult.updated_at;

    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the record
    const updateResult = await updateBeerCount({ count: 15 });
    
    // Verify timestamp was updated
    expect(updateResult.updated_at.getTime()).toBeGreaterThan(initialTime.getTime());
  });
});
