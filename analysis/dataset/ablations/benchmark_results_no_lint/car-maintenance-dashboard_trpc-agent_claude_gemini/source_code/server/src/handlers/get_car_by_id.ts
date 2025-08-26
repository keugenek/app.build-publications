import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetCarByIdInput, type Car } from '../schema';

export const getCarById = async (input: GetCarByIdInput): Promise<Car | null> => {
  try {
    const results = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    // Return null if car not found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    return results[0];
  } catch (error) {
    console.error('Failed to get car by ID:', error);
    throw error;
  }
};
