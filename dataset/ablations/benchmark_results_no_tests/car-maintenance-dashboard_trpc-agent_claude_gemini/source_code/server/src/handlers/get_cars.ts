import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car } from '../schema';

export const getCars = async (): Promise<Car[]> => {
  try {
    const results = await db.select()
      .from(carsTable)
      .execute();

    // No numeric conversions needed - all fields are integers/strings/dates
    return results;
  } catch (error) {
    console.error('Failed to fetch cars:', error);
    throw error;
  }
};
