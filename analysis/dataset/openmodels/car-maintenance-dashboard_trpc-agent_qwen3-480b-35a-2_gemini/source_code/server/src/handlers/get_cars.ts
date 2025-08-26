import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car } from '../schema';

export const getCars = async (): Promise<Car[]> => {
  try {
    const cars = await db.select()
      .from(carsTable)
      .execute();

    // Map database fields to schema fields
    return cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      licensePlate: car.licensePlate,
      vin: car.vin,
      nextServiceDate: car.nextServiceDate ? new Date(car.nextServiceDate) : null,
      nextServiceMileage: car.nextServiceMileage,
      created_at: new Date(car.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch cars:', error);
    throw error;
  }
};
