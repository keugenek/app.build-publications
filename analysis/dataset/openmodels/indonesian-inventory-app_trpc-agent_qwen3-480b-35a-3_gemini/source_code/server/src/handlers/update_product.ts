import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product | null> => {
  try {
    // Prepare update values - only include fields that are provided
    const updateValues: any = {
      updated_at: new Date() // Always update the timestamp
    };
    
    if (input.code !== undefined) updateValues.code = input.code;
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.purchase_price !== undefined) updateValues.purchase_price = input.purchase_price.toString();
    if (input.selling_price !== undefined) updateValues.selling_price = input.selling_price.toString();
    if (input.stock_quantity !== undefined) updateValues.stock_quantity = input.stock_quantity;

    // Update product record
    const result = await db.update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // If no rows were updated, return null
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      purchase_price: parseFloat(product.purchase_price),
      selling_price: parseFloat(product.selling_price)
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
