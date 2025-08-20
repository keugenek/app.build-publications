import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

export const getServices = async (): Promise<Service[]> => {
  try {
    // Fetch all services from the database
    const results = await db.select()
      .from(servicesTable)
      .execute();

    // Return the services (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
};
