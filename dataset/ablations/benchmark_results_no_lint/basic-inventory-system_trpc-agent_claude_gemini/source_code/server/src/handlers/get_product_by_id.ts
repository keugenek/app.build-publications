import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock_level: product.stock_level,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  } catch (error) {
    console.error('Failed to get product by id:', error);
    throw error;
  }
}
