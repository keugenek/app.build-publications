import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCar = async (input: UpdateCarInput): Promise<Car | null> => {
  try {
    // Build the update object with only the provided fields
    const updateData: Partial<typeof carsTable.$inferInsert> = {};
    
    if (input.make !== undefined) updateData.make = input.make;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.year !== undefined) updateData.year = input.year;
    if (input.license_plate !== undefined) updateData.license_plate = input.license_plate;
    if (input.vin !== undefined) updateData.vin = input.vin;

    // Update the car record
    const result = await db.update(carsTable)
      .set(updateData)
      .where(eq(carsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated car or null if not found
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Car update failed:', error);
    throw error;
  }
};
