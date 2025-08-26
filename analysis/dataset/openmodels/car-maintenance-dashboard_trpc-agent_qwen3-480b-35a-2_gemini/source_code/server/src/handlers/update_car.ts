import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCar = async (input: UpdateCarInput): Promise<Car> => {
  try {
    // Build update data object with only provided fields
    const updateData: any = {};
    if (input.make !== undefined) updateData.make = input.make;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.year !== undefined) updateData.year = input.year;
    if (input.licensePlate !== undefined) updateData.licensePlate = input.licensePlate;
    if (input.vin !== undefined) updateData.vin = input.vin;
    if (input.nextServiceDate !== undefined) updateData.nextServiceDate = input.nextServiceDate;
    if (input.nextServiceMileage !== undefined) updateData.nextServiceMileage = input.nextServiceMileage;

    // Update car record
    const result = await db.update(carsTable)
      .set(updateData)
      .where(eq(carsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Car with id ${input.id} not found`);
    }

    // Convert date strings back to Date objects before returning
    const car = result[0];
    return {
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      licensePlate: car.licensePlate,
      vin: car.vin,
      nextServiceDate: car.nextServiceDate ? new Date(car.nextServiceDate) : null,
      nextServiceMileage: car.nextServiceMileage,
      created_at: car.created_at
    };
  } catch (error) {
    console.error('Car update failed:', error);
    throw error;
  }
};
