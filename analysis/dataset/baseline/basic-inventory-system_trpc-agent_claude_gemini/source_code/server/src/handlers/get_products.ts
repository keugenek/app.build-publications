import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch all products from the database
    const result = await db.select()
      .from(productsTable)
      .execute();

    // Return products - no numeric conversion needed as all fields are integers/strings/dates
    return result;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
