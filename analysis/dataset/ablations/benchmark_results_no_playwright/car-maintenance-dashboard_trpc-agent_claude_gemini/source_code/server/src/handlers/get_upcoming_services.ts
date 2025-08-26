import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { type UpcomingService } from '../schema';

export const getUpcomingServices = async (): Promise<UpcomingService[]> => {
  try {
    const results = await db.select()
      .from(upcomingServicesTable)
      .execute();

    // Return results directly as upcoming services don't have numeric fields that need conversion
    return results;
  } catch (error) {
    console.error('Failed to fetch upcoming services:', error);
    throw error;
  }
};
