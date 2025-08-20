import { db } from '../db';
import { plumbingServicesTable } from '../db/schema';
import { type PlumbingService } from '../schema';
import { asc } from 'drizzle-orm';

export const getPlumbingServices = async (): Promise<PlumbingService[]> => {
  try {
    // Fetch all plumbing services ordered by display_order for consistent presentation
    const results = await db.select()
      .from(plumbingServicesTable)
      .orderBy(asc(plumbingServicesTable.display_order))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch plumbing services:', error);
    throw error;
  }
};
