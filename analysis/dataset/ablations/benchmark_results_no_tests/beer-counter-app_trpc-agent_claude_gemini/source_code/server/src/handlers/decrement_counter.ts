import { db } from '../db';
import { countersTable } from '../db/schema';
import { type DecrementCounterInput, type Counter } from '../schema';
import { eq } from 'drizzle-orm';

export const decrementCounter = async (input: DecrementCounterInput): Promise<Counter> => {
  try {
    // First, get the current counter to check if it exists and get current count
    const existingCounters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, input.id))
      .execute();

    if (existingCounters.length === 0) {
      throw new Error(`Counter with id ${input.id} not found`);
    }

    const currentCounter = existingCounters[0];
    
    // Calculate new count, ensuring it doesn't go below 0
    const newCount = Math.max(0, currentCounter.count - input.amount);

    // Update the counter with the new count and updated timestamp
    const result = await db.update(countersTable)
      .set({
        count: newCount,
        updated_at: new Date()
      })
      .where(eq(countersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Counter decrement failed:', error);
    throw error;
  }
};
