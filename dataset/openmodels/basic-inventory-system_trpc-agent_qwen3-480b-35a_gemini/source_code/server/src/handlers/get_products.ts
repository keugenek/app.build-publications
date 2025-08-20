import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Convert numeric fields and dates to proper types
    return results.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      created_at: product.created_at,
      updated_at: product.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
