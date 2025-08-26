import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCar = async (input: UpdateCarInput): Promise<Car> => {
  try {
    // First, check if the car exists
    const existingCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    if (existingCars.length === 0) {
      throw new Error(`Car with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof carsTable.$inferInsert> = {};
    
    if (input.make !== undefined) updateData.make = input.make;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.year !== undefined) updateData.year = input.year;
    if (input.vin !== undefined) updateData.vin = input.vin;
    if (input.license_plate !== undefined) updateData.license_plate = input.license_plate;
    if (input.current_mileage !== undefined) updateData.current_mileage = input.current_mileage;

    // Update the car record
    const result = await db.update(carsTable)
      .set(updateData)
      .where(eq(carsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Car update failed:', error);
    throw error;
  }
};
