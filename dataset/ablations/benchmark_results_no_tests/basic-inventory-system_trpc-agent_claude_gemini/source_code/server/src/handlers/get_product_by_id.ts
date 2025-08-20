import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    // Query product by ID
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    // Return null if product not found
    if (results.length === 0) {
      return null;
    }

    // Return the found product
    const product = results[0];
    return {
      ...product
    };
  } catch (error) {
    console.error('Failed to fetch product by ID:', error);
    throw error;
  }
};
