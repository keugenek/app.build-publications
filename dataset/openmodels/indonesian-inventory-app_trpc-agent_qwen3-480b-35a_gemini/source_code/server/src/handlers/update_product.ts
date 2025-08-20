import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof productsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.stock_quantity !== undefined) {
      updateData.stock_quantity = input.stock_quantity;
    }

    // Update product record
    const result = await db.update(productsTable)
      .set({
        ...updateData,
        updated_at: new Date() // Always update the timestamp
      })
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update product with id ${input.id}`);
    }

    const product = result[0];
    return {
      ...product,
      // No numeric conversions needed as stock_quantity is an integer
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};