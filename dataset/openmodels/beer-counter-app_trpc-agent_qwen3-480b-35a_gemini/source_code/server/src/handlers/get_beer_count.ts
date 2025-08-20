import { db } from '../db';
import { beerCounterTable } from '../db/schema';
import { asc, eq } from 'drizzle-orm';
import { type BeerCounter as ZodBeerCounter, type UpdateBeerCountInput } from '../schema';
import { type BeerCounter as DbBeerCounter } from '../db/schema';

// Helper function to convert database type to Zod schema type
const toZodBeerCounter = (dbRecord: DbBeerCounter): ZodBeerCounter => ({
  id: dbRecord.id,
  count: dbRecord.count,
  updated_at: dbRecord.updated_at
});

export const getBeerCount = async (): Promise<ZodBeerCounter> => {
  try {
    // Query the beer counter record, ordering by ID ascending and taking the first one
    const result = await db.select()
      .from(beerCounterTable)
      .orderBy(asc(beerCounterTable.id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      // If no record exists, create and return a default record with count 0
      const [defaultRecord] = await db.insert(beerCounterTable)
        .values({})
        .returning()
        .execute();
      
      return toZodBeerCounter(defaultRecord);
    }

    // Return the first record
    return toZodBeerCounter(result[0]);
  } catch (error) {
    console.error('Failed to get beer count:', error);
    throw error;
  }
};

export const updateBeerCount = async (input: UpdateBeerCountInput): Promise<ZodBeerCounter> => {
  try {
    // First get the existing record if it exists
    const existingRecords = await db.select()
      .from(beerCounterTable)
      .orderBy(asc(beerCounterTable.id))
      .limit(1)
      .execute();

    if (existingRecords.length > 0) {
      // Update the existing record
      const [updatedRecord] = await db.update(beerCounterTable)
        .set({
          count: input.count,
          updated_at: new Date()
        })
        .where(eq(beerCounterTable.id, existingRecords[0].id))
        .returning()
        .execute();

      return toZodBeerCounter(updatedRecord);
    }

    // If no record exists, create one
    const [newRecord] = await db.insert(beerCounterTable)
      .values({
        count: input.count
      })
      .returning()
      .execute();
    
    return toZodBeerCounter(newRecord);
  } catch (error) {
    console.error('Failed to update beer count:', error);
    throw error;
  }
};
