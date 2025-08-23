import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

/**
 * Fetches all services from the database.
 * Numeric columns (price) are stored as strings in PostgreSQL via Drizzle, so we
 * convert them back to numbers before returning.
 */
export const getServices = async (): Promise<Service[]> => {
  try {
    const rows = await db.select().from(servicesTable).execute();
    // Convert numeric fields back to numbers
    return rows.map((row) => ({
      ...row,
      price: parseFloat(row.price as unknown as string),
    }));
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
};
