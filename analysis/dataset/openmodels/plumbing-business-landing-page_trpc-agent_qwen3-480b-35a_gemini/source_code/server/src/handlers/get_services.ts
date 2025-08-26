import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

export const getServices = async (): Promise<Service[]> => {
  try {
    const results = await db.select()
      .from(servicesTable)
      .orderBy(servicesTable.created_at)
      .execute();

    return results.map(service => ({
      ...service,
      created_at: service.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
};
