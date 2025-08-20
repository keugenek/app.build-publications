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
        stock_level: input.stock_level // This already has a default of 0 from Zod schema
      })
      .returning()
      .execute();

    // Return the created product
    const product = result[0];
    return {
      ...product
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
