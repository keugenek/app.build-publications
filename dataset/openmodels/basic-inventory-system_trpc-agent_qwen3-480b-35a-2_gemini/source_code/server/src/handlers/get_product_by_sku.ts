import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Product } from '../schema';

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  try {
    const result = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, sku))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const product = result[0];
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock_level: product.stock_level,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch product by SKU:', error);
    throw error;
  }
};
