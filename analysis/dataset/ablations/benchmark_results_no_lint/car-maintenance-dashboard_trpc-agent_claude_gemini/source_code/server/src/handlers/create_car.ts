import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput, type Car } from '../schema';
import { eq } from 'drizzle-orm';

export const createCar = async (input: CreateCarInput): Promise<Car> => {
  try {
    // Check if VIN already exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.vin, input.vin))
      .execute();

    if (existingCar.length > 0) {
      throw new Error(`Car with VIN ${input.vin} already exists`);
    }

    // Insert car record
    const result = await db.insert(carsTable)
      .values({
        make: input.make,
        model: input.model,
        year: input.year,
        vin: input.vin
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Car creation failed:', error);
    throw error;
  }
};
