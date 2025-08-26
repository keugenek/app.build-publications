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
        stockLevel: input.stockLevel
      })
      .returning()
      .execute();

    const product = result[0];
    
    // Convert to the expected schema type
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockLevel: product.stockLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
