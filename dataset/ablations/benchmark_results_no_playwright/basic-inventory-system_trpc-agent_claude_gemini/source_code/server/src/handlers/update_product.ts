import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // First, check if the product exists
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with ID ${input.id} not found`);
    }

    // If SKU is being updated, check for uniqueness
    if (input.sku) {
      const duplicateSkuProducts = await db.select()
        .from(productsTable)
        .where(
          and(
            eq(productsTable.sku, input.sku),
            ne(productsTable.id, input.id)
          )
        )
        .execute();

      if (duplicateSkuProducts.length > 0) {
        throw new Error(`Product with SKU '${input.sku}' already exists`);
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof productsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the product
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
