import { db } from '../db';
import { carsTable, maintenanceRecordsTable, upcomingServicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCar = async (id: number): Promise<boolean> => {
  try {
    // Check if car exists first
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, id))
      .execute();
    
    if (existingCar.length === 0) {
      return false;
    }
    
    // Delete in proper order to respect foreign key constraints
    // First, delete related maintenance records
    await db.delete(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, id))
      .execute();
    
    // Then, delete related upcoming services
    await db.delete(upcomingServicesTable)
      .where(eq(upcomingServicesTable.car_id, id))
      .execute();
    
    // Finally, delete the car itself
    const result = await db.delete(carsTable)
      .where(eq(carsTable.id, id))
      .returning()
      .execute();
    
    // Return true if a car was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Car deletion failed:', error);
    throw error;
  }
};
