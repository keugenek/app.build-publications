import { db } from '../db';
import { carsTable, maintenanceHistoryTable, serviceRemindersTable } from '../db/schema';
import { type DeleteByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCar(input: DeleteByIdInput): Promise<boolean> {
  try {
    // First check if the car exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    if (existingCar.length === 0) {
      return false; // Car not found
    }

    // Delete related maintenance history records first
    await db.delete(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, input.id))
      .execute();

    // Delete related service reminders
    await db.delete(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, input.id))
      .execute();

    // Finally delete the car itself
    const result = await db.delete(carsTable)
      .where(eq(carsTable.id, input.id))
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Car deletion failed:', error);
    throw error;
  }
}
