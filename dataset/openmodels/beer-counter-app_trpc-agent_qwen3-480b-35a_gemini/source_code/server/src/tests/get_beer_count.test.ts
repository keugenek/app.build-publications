import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { beerCounterTable } from '../db/schema';
import { getBeerCount, updateBeerCount } from '../handlers/get_beer_count';
import { eq } from 'drizzle-orm';

describe('getBeerCount and updateBeerCount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a default beer counter record when none exists', async () => {
    const result = await getBeerCount();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.count).toBe(0); // Default count should be 0
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return existing beer counter record', async () => {
    // First, create a record with a specific count
    const [createdRecord] = await db.insert(beerCounterTable)
      .values({ count: 5 })
      .returning()
      .execute();

    // Then get the beer count
    const result = await getBeerCount();

    expect(result).toBeDefined();
    expect(result.id).toBe(createdRecord.id);
    expect(result.count).toBe(5);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update beer count when record exists', async () => {
    // First, create a record
    const [createdRecord] = await db.insert(beerCounterTable)
      .values({ count: 10 })
      .returning()
      .execute();

    // Update the count
    const updatedResult = await updateBeerCount({ count: 25 });

    expect(updatedResult).toBeDefined();
    expect(updatedResult.id).toBe(createdRecord.id);
    expect(updatedResult.count).toBe(25);
    expect(updatedResult.updated_at).toBeInstanceOf(Date);
    
    // Verify in database
    const dbRecords = await db.select()
      .from(beerCounterTable)
      .where(eq(beerCounterTable.id, createdRecord.id))
      .execute();
    
    expect(dbRecords).toHaveLength(1);
    expect(dbRecords[0].count).toBe(25);
  });

  it('should create a new record when updating and none exists', async () => {
    // Ensure table is empty first
    await db.delete(beerCounterTable).execute();
    
    // Update count (should create new record)
    const result = await updateBeerCount({ count: 15 });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.count).toBe(15);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify in database
    const dbRecords = await db.select().from(beerCounterTable).execute();
    expect(dbRecords).toHaveLength(1);
    expect(dbRecords[0].count).toBe(15);
  });

  it('should handle multiple updates correctly', async () => {
    // Create initial record
    const [record] = await db.insert(beerCounterTable)
      .values({ count: 0 })
      .returning()
      .execute();

    // Perform multiple updates
    await updateBeerCount({ count: 10 });
    await updateBeerCount({ count: 20 });
    const finalResult = await updateBeerCount({ count: 30 });

    expect(finalResult.count).toBe(30);
    
    // Verify in database
    const dbRecords = await db.select()
      .from(beerCounterTable)
      .where(eq(beerCounterTable.id, record.id))
      .execute();
    
    expect(dbRecords).toHaveLength(1);
    expect(dbRecords[0].count).toBe(30);
  });
});
