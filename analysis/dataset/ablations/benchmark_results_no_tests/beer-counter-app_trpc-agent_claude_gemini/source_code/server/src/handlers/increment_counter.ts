import { db } from '../db';
import { countersTable } from '../db/schema';
import { type IncrementCounterInput, type Counter } from '../schema';
import { eq } from 'drizzle-orm';

export const incrementCounter = async (input: IncrementCounterInput): Promise<Counter> => {
  try {
    // First, get the current counter to verify it exists and get current values
    const existingCounters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, input.id))
      .execute();

    if (existingCounters.length === 0) {
      throw new Error(`Counter with id ${input.id} not found`);
    }

    const existingCounter = existingCounters[0];

    // Update the counter by incrementing the count and updating timestamp
    const result = await db.update(countersTable)
      .set({
        count: existingCounter.count + input.amount,
        updated_at: new Date()
      })
      .where(eq(countersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Counter increment failed:', error);
    throw error;
  }
};
