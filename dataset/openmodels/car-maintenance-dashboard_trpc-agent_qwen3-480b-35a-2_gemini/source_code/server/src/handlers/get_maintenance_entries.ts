import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getMaintenanceEntries = async (carId?: number): Promise<MaintenanceEntry[]> => {
  try {
    // Build the base query
    let query = db.select().from(maintenanceEntriesTable) as any;
    
    // If carId is provided, filter by it
    if (carId !== undefined) {
      query = query.where(eq(maintenanceEntriesTable.carId, carId));
    }
    
    // Execute the query
    const results = await query.execute();
    
    // Convert numeric fields back to numbers before returning and ensure proper date objects
    return results.map((entry: any) => ({
      ...entry,
      cost: parseFloat(entry.cost), // Convert string back to number
      dateOfService: entry.dateOfService ? new Date(entry.dateOfService) : new Date(), // Ensure date objects
      created_at: new Date(entry.created_at) // Ensure date objects
    }));
  } catch (error) {
    console.error('Failed to fetch maintenance entries:', error);
    throw error;
  }
};
