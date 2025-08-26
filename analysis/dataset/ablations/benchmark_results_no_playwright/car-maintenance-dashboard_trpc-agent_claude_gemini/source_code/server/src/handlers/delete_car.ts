import { db } from '../db';
import { carsTable, maintenanceRecordsTable, upcomingServicesTable } from '../db/schema';
import { type DeleteRecordInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCar = async (input: DeleteRecordInput): Promise<{ success: boolean }> => {
  try {
    // First verify the car exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    if (existingCar.length === 0) {
      throw new Error(`Car with id ${input.id} not found`);
    }

    // Delete related maintenance records first (foreign key constraint)
    await db.delete(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, input.id))
      .execute();

    // Delete related upcoming services
    await db.delete(upcomingServicesTable)
      .where(eq(upcomingServicesTable.car_id, input.id))
      .execute();

    // Finally delete the car record
    await db.delete(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Car deletion failed:', error);
    throw error;
  }
};
