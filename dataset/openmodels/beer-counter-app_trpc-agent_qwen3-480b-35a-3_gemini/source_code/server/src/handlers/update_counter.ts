import { eq } from 'drizzle-orm';
import { type UpdateCounterInput, type Counter } from '../schema';
import { db } from '../db';
import { countersTable } from '../db/schema';

export const updateCounter = async (input: UpdateCounterInput): Promise<Counter> => {
  // Update the counter in the database
  const [updatedCounter] = await db
    .update(countersTable)
    .set({ count: input.count, updated_at: new Date() })
    .where(eq(countersTable.id, input.id))
    .returning();
  
  // If no rows were updated, create a new counter
  if (!updatedCounter) {
    const [newCounter] = await db
      .insert(countersTable)
      .values({ id: input.id, count: input.count })
      .returning();
    
    return {
      id: newCounter.id,
      count: newCounter.count,
      updated_at: newCounter.updated_at
    };
  }
  
  return {
    id: updatedCounter.id,
    count: updatedCounter.count,
    updated_at: updatedCounter.updated_at
  };
};
