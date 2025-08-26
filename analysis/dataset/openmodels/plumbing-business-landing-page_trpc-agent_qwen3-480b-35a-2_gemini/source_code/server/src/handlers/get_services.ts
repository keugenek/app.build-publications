import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

export const getServices = async (): Promise<Service[]> => {
  try {
    const results = await db.select()
      .from(servicesTable)
      .orderBy(servicesTable.id)
      .execute();

    // Map results to match the Service schema type
    return results.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      icon: service.icon,
      created_at: service.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
};