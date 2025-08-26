import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

/**
 * Fetch all products from the database.
 * Returns an array of Product objects.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const rows = await db.select().from(productsTable).execute();
    // No numeric conversions needed for this table (stock_quantity is integer)
    return rows;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
