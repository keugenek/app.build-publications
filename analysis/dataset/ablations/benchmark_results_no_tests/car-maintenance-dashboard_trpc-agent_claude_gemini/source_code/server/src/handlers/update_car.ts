import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCar = async (input: UpdateCarInput): Promise<Car> => {
  try {
    // Build the update data object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.make !== undefined) {
      updateData.make = input.make;
    }
    if (input.model !== undefined) {
      updateData.model = input.model;
    }
    if (input.year !== undefined) {
      updateData.year = input.year;
    }
    if (input.license_plate !== undefined) {
      updateData.license_plate = input.license_plate;
    }
    if (input.current_mileage !== undefined) {
      updateData.current_mileage = input.current_mileage;
    }

    // Update the car record and return the updated data
    const result = await db.update(carsTable)
      .set(updateData)
      .where(eq(carsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Car with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Car update failed:', error);
    throw error;
  }
};
