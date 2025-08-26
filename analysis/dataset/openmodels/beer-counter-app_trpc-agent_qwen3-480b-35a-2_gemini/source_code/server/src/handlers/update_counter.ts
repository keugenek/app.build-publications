import { type UpdateCounterInput, type Counter } from '../schema';
import { db } from '../db';
import { counterTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateCounter = async (input: UpdateCounterInput): Promise<Counter> => {
  const updatedCounter = {
    value: input.value,
    updated_at: new Date()
  };
  
  // Update or insert the counter value
  await db
    .insert(counterTable)
    .values({
      id: 1,
      value: input.value,
      updated_at: new Date()
    })
    .onConflictDoUpdate({
      target: counterTable.id,
      set: {
        value: input.value,
        updated_at: new Date()
      }
    });
  
  return updatedCounter;
};