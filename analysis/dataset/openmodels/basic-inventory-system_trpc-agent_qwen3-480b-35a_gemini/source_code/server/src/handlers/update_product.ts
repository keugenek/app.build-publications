import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product | null> => {
  try {
    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof productsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }
    
    if (input.stock_quantity !== undefined) {
      updateData.stock_quantity = input.stock_quantity;
    }

    // Update the product record
    const result = await db.update(productsTable)
      .set({
        ...updateData,
        updated_at: new Date() // Always update the timestamp
      })
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no product was found/updated
    if (result.length === 0) {
      return null;
    }

    // Return the updated product
    const product = result[0];
    return {
      ...product,
      stock_quantity: product.stock_quantity // Integer column - no conversion needed
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
