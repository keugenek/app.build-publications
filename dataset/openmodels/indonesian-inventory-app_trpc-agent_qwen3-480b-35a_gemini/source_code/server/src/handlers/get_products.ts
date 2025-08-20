import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .execute();

    // Map results to ensure proper typing and handle any conversions
    return results.map(product => ({
      ...product,
      stock_quantity: product.stock_quantity // Integer column - no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};