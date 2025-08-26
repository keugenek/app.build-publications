import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductByIdInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductById(input: GetProductByIdInput): Promise<Product | null> {
  try {
    // Query the database for the product by ID
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    // Return null if no product found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    const product = results[0];
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      stock_level: product.stock_level,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  } catch (error) {
    console.error('Failed to get product by ID:', error);
    throw error;
  }
}
