import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car } from '../schema';
import { asc } from 'drizzle-orm';

export async function getCars(): Promise<Car[]> {
  try {
    const results = await db.select()
      .from(carsTable)
      .orderBy(asc(carsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch cars:', error);
    throw error;
  }
}
