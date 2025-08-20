import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteUpcomingService = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, id))
      .execute();
    
    // If rows were affected, deletion was successful
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Failed to delete upcoming service:', error);
    throw error;
  }
};
