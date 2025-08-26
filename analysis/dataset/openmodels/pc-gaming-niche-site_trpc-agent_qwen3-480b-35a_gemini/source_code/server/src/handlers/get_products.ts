import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : null
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
