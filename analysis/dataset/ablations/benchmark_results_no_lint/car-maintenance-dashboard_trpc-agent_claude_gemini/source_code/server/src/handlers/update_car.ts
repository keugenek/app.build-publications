import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export async function updateCar(input: UpdateCarInput): Promise<Car> {
  try {
    // First, verify the car exists
    const existingCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    if (existingCars.length === 0) {
      throw new Error(`Car with id ${input.id} not found`);
    }

    // If VIN is being updated, check for uniqueness
    if (input.vin !== undefined) {
      const vinConflicts = await db.select()
        .from(carsTable)
        .where(and(
          eq(carsTable.vin, input.vin),
          ne(carsTable.id, input.id) // Exclude current car from uniqueness check
        ))
        .execute();

      if (vinConflicts.length > 0) {
        throw new Error(`VIN ${input.vin} already exists for another car`);
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof carsTable.$inferInsert> = {};
    
    if (input.make !== undefined) updateData.make = input.make;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.year !== undefined) updateData.year = input.year;
    if (input.vin !== undefined) updateData.vin = input.vin;

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
}
