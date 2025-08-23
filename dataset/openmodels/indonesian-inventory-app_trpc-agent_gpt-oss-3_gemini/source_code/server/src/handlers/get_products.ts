import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

/**
 * Fetch all products from the database.
 * Numeric columns are converted back to numbers according to the project rules.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const rows = await db.select().from(productsTable).execute();
    // Convert numeric fields (harga_satuan) back to numbers
    return rows.map((row) => ({
      ...row,
      // Drizzle returns numeric columns as strings
      harga_satuan: parseFloat(row.harga_satuan as unknown as string),
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
