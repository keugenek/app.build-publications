import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch all products from the database
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Return the products with proper type conversion
    return results.map(product => ({
      ...product,
      // Ensure dates are properly converted to Date objects
      created_at: new Date(product.created_at),
      updated_at: new Date(product.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
