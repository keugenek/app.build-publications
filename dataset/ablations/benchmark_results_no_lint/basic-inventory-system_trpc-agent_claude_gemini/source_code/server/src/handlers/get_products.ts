import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch all products from the database
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Return the products - no numeric conversions needed as all fields are integers/text/dates
    return results;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
