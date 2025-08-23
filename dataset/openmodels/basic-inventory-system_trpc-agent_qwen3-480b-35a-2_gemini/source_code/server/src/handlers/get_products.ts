import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Convert database results to the expected schema format
    return results.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock_level: product.stock_level,
      created_at: product.created_at,
      updated_at: product.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
