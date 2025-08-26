import { db } from '../db';
import { countersTable } from '../db/schema';
import { type Counter } from '../schema';
import { eq } from 'drizzle-orm';

export const getCounter = async (id: number): Promise<Counter | null> => {
  try {
    // Query the counter by ID
    const result = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, id))
      .execute();

    // Return null if counter doesn't exist
    if (result.length === 0) {
      return null;
    }

    // Return the first (and only) result
    const counter = result[0];
    return {
      id: counter.id,
      count: counter.count,
      created_at: counter.created_at,
      updated_at: counter.updated_at
    };
  } catch (error) {
    console.error('Counter retrieval failed:', error);
    throw error;
  }
};
