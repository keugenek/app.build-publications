import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetCarByIdInput, type Car } from '../schema';

export async function getCarById(input: GetCarByIdInput): Promise<Car | null> {
  try {
    // Query the database for the car with the specified ID
    const results = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    // Return the first result if found, otherwise return null
    if (results.length === 0) {
      return null;
    }

    const car = results[0];
    return {
      ...car,
      // No numeric conversion needed - all fields are already proper types
      // (id: number, year: number, current_mileage: number)
    };
  } catch (error) {
    console.error('Get car by ID failed:', error);
    throw error;
  }
}
