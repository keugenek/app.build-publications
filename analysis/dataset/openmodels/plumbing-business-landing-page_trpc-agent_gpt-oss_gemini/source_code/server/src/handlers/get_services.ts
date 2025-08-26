import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

/**
 * Fetch all plumbing services from the database.
 * Numeric fields (price) are stored as PostgreSQL numeric, returned as strings by Drizzle.
 * This handler converts `price` to a number (or null) before returning.
 */
export const getServices = async (): Promise<Service[]> => {
  try {
    const rows = await db.select().from(servicesTable).execute();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price !== null && row.price !== undefined ? parseFloat(row.price) : null,
    }));
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
};
