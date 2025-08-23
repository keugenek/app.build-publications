import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCar = async (id: number): Promise<boolean> => {
  try {
    // First, delete all maintenance entries associated with this car
    // This is necessary due to the foreign key constraint
    await db.delete(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.carId, id))
      .execute();
    
    // Then delete the car itself
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
