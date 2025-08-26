import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product | null> => {
  try {
    // First check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      return null;
    }

    // If SKU is being updated, check for uniqueness
    if (input.sku) {
      const duplicateSku = await db.select()
        .from(productsTable)
        .where(eq(productsTable.sku, input.sku))
        .execute();

      // Check if another product already has this SKU
      if (duplicateSku.length > 0 && duplicateSku[0].id !== input.id) {
        throw new Error(`SKU '${input.sku}' already exists for another product`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }
    if (input.stock_level !== undefined) {
      updateData.stock_level = input.stock_level;
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
