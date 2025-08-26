import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateProductInput, type Product } from '../schema';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof productsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }
    
    if (input.stock_level !== undefined) {
      updateData.stock_level = input.stock_level;
    }
    
    // Update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update product record
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Return the updated product
    const product = result[0];
    return {
      ...product,
      stock_level: product.stock_level // Integer column - no conversion needed
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
