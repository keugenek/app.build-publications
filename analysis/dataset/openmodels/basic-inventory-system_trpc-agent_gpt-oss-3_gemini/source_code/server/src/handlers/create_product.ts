import { db } from '../db';
import { products } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

/**
 * Handler for creating a new product.
 * Inserts the product into the database and returns the created record,
 * including generated id and timestamps.
 */
export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    const result = await db
      .insert(products)
      .values({
        name: input.name,
        sku: input.sku,
        stock_quantity: input.stock_quantity,
      })
      .returning()
      .execute();
    // Drizzle returns an array; take first element
    const product = result[0];
    return product as Product;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};
