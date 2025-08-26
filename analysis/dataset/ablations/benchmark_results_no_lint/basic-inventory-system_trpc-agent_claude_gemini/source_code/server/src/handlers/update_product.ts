import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export async function updateProduct(input: UpdateProductInput): Promise<Product | null> {
  try {
    const { id, ...updateFields } = input;

    // Check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (existingProduct.length === 0) {
      return null;
    }

    // If SKU is being updated, check for uniqueness
    if (updateFields.sku) {
      const skuConflict = await db.select()
        .from(productsTable)
        .where(
          and(
            eq(productsTable.sku, updateFields.sku),
            ne(productsTable.id, id)
          )
        )
        .execute();

      if (skuConflict.length > 0) {
        throw new Error(`SKU '${updateFields.sku}' already exists`);
      }
    }

    // Build update object with updated_at timestamp
    const updateData = {
      ...updateFields,
      updated_at: new Date()
    };

    // Update the product
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
}
