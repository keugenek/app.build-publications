import { db } from '../db';
import { carsTable, maintenanceEntriesTable, serviceSchedulesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteCarInput } from '../schema';

export async function deleteCar(input: DeleteCarInput): Promise<{ success: boolean }> {
  try {
    // First, verify the car exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    if (existingCar.length === 0) {
      throw new Error(`Car with id ${input.id} not found`);
    }

    // Delete related data first to respect foreign key constraints
    
    // Delete maintenance entries for this car
    await db.delete(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, input.id))
      .execute();

    // Delete service schedules for this car
    await db.delete(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.car_id, input.id))
      .execute();

    // Finally, delete the car itself
    await db.delete(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Car deletion failed:', error);
    throw error;
  }
}
