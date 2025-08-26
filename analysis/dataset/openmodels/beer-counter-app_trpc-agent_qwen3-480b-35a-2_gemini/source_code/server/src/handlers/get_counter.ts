import { type Counter } from '../schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { counterTable } from '../db/schema';

export const getCounter = async (): Promise<Counter> => {
  // Try to get the counter from the database
  const result = await db.select().from(counterTable).where(eq(counterTable.id, 1)).limit(1);
  
  if (result.length > 0) {
    return {
      value: result[0].value,
      updated_at: result[0].updated_at
    };
  }
  
  // If no counter exists, create a default one
  const defaultCounter = {
    value: 0,
    updated_at: new Date()
  };
  
  await db.insert(counterTable).values({
    id: 1,
    value: 0,
    updated_at: new Date()
  }).onConflictDoNothing();
  
  return defaultCounter;
};