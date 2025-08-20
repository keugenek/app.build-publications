import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        sku: input.sku,
        description: input.description || null,
        stock_level: input.initial_stock || 0
      })
      .returning()
      .execute();

    // Return the created product
    const product = result[0];
    return {
      ...product,
      stock_level: product.stock_level // Integer column - no conversion needed
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
