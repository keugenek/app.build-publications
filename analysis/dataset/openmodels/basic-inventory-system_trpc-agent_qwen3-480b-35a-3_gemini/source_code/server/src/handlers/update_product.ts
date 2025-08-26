import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Build the update data object with only provided fields
    const updateData: Partial<typeof productsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }
    
    if (input.stockLevel !== undefined) {
      updateData.stockLevel = input.stockLevel;
    }
    
    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    // Update product record
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    const product = result[0];
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockLevel: product.stockLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
