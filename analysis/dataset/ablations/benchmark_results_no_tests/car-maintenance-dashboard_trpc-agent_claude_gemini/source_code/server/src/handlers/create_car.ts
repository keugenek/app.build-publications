import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput, type Car } from '../schema';

export const createCar = async (input: CreateCarInput): Promise<Car> => {
  try {
    // Insert car record
    const result = await db.insert(carsTable)
      .values({
        make: input.make,
        model: input.model,
        year: input.year,
        license_plate: input.license_plate,
        current_mileage: input.current_mileage
      })
      .returning()
      .execute();

    const car = result[0];
    return car;
  } catch (error) {
    console.error('Car creation failed:', error);
    throw error;
  }
};
