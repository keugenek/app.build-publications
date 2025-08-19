import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductByIdInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductById(input: GetProductByIdInput): Promise<Product | null> {
  try {
    const result = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
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
    console.error('Failed to fetch product by id:', error);
    throw error;
  }
}
