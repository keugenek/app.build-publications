import { eq } from 'drizzle-orm';
import { type Counter, type UpdateCounterInput } from '../schema';
import { db } from '../db';
import { countersTable } from '../db/schema';

export const getCounter = async (id: number): Promise<Counter> => {
  // Try to fetch the counter from the database
  const result = await db.select().from(countersTable).where(eq(countersTable.id, id));
  
  if (result.length > 0) {
    return {
      id: result[0].id,
      count: result[0].count,
      updated_at: result[0].updated_at
    };
  }
  
  // If counter doesn't exist, create a new one with default values
  const [newCounter] = await db.insert(countersTable).values({ id, count: 0 }).returning();
  
  return {
    id: newCounter.id,
    count: newCounter.count,
    updated_at: newCounter.updated_at
  };
};

export const updateCounter = async (input: UpdateCounterInput): Promise<Counter> => {
  try {
    // Update the counter in the database
    const result = await db.update(countersTable)
      .set({
        count: input.count,
        updated_at: new Date()
      })
      .where(eq(countersTable.id, input.id))
      .returning();
    
    // If no rows were updated, throw an error
    if (result.length === 0) {
      throw new Error(`Counter with id ${input.id} not found`);
    }
    
    // Return the updated counter
    return {
      id: result[0].id,
      count: result[0].count,
      updated_at: result[0].updated_at
    };
  } catch (error) {
    console.error('Counter update failed:', error);
    throw error;
  }
};
