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
        stock_level: input.stock_level // Default handled by Zod schema
      })
      .returning()
      .execute();

    const product = result[0];
    return {
      ...product,
      // No numeric conversions needed - all fields are already correct types
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
