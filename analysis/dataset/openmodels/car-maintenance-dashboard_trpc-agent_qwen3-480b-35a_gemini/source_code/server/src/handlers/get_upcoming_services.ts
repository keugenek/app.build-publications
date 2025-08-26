import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { type UpcomingService } from '../schema';
import { eq } from 'drizzle-orm';

export const getUpcomingServices = async (carId: number): Promise<UpcomingService[]> => {
  try {
    const results = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.car_id, carId))
      .execute();

    // Convert date strings to Date objects
    return results.map(service => ({
      ...service,
      due_date: service.due_date ? new Date(service.due_date) : null,
      created_at: new Date(service.created_at)
    }));
  } catch (error) {
    console.error('Fetching upcoming services failed:', error);
    throw error;
  }
};
