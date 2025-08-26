import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';
import { asc, eq } from 'drizzle-orm';

export async function getServices(): Promise<Service[]> {
  try {
    // Fetch all services ordered by display_order, then by created_at
    // Featured services will naturally appear first due to lower display_order values
    const results = await db.select()
      .from(servicesTable)
      .orderBy(asc(servicesTable.display_order), asc(servicesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
}

export async function getFeaturedServices(): Promise<Service[]> {
  try {
    // Fetch only featured services ordered by display_order
    const results = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.is_featured, true))
      .orderBy(asc(servicesTable.display_order), asc(servicesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch featured services:', error);
    throw error;
  }
}
