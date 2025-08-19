import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Check if SKU already exists to ensure uniqueness
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, input.sku))
      .limit(1)
      .execute();

    if (existingProduct.length > 0) {
      throw new Error(`Product with SKU '${input.sku}' already exists`);
    }

    // Insert new product
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        sku: input.sku,
        stock_level: input.stock_level // Default of 0 is handled by Zod schema
      })
      .returning()
      .execute();

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
    console.error('Product creation failed:', error);
    throw error;
  }
};
