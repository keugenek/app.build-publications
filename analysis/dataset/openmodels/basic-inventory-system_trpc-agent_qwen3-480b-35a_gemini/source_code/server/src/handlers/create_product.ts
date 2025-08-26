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
        stock_quantity: input.stock_quantity
      })
      .returning()
      .execute();

    const product = result[0];
    return {
      ...product,
      created_at: new Date(product.created_at),
      updated_at: new Date(product.updated_at)
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
