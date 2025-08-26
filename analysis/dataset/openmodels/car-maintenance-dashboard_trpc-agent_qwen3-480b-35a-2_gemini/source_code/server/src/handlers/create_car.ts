import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput, type Car } from '../schema';

export const createCar = async (input: CreateCarInput): Promise<Car> => {
  try {
    const result = await db.insert(carsTable)
      .values({
        make: input.make,
        model: input.model,
        year: input.year,
        licensePlate: input.licensePlate,
        vin: input.vin,
        nextServiceDate: input.nextServiceDate ? input.nextServiceDate.toISOString().split('T')[0] : null,
        nextServiceMileage: input.nextServiceMileage
      })
      .returning()
      .execute();

    const car = result[0];
    return {
      ...car,
      nextServiceDate: car.nextServiceDate ? new Date(car.nextServiceDate) : null,
      created_at: new Date(car.created_at)
    };
  } catch (error) {
    console.error('Car creation failed:', error);
    throw error;
  }
};
