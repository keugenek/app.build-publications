import { db } from '../db';
import { beerCounterTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateBeerCountInput } from '../schema';
import { type BeerCounter as DBBeerCounter } from '../db/schema';
import { type BeerCounter } from '../schema';

export const updateBeerCount = async (input: UpdateBeerCountInput): Promise<BeerCounter> => {
  try {
    // Try to update the existing row (assuming there's only one row)
    const result = await db.update(beerCounterTable)
      .set({
        count: input.count,
        updated_at: new Date()
      })
      .where(eq(beerCounterTable.id, 1))
      .returning()
      .execute();

    // If no rows were updated, insert a new row
    if (result.length === 0) {
      const insertResult = await db.insert(beerCounterTable)
        .values({
          id: 1,
          count: input.count,
          updated_at: new Date()
        })
        .returning()
        .execute();
        
      return {
        id: insertResult[0].id,
        count: insertResult[0].count,
        updated_at: insertResult[0].updated_at
      };
    }

    return {
      id: result[0].id,
      count: result[0].count,
      updated_at: result[0].updated_at
    };
  } catch (error) {
    console.error('Failed to update beer count:', error);
    throw error;
  }
};
