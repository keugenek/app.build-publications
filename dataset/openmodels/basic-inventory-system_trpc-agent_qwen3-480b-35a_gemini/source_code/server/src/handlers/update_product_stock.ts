import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProductStock = async (productId: number, newQuantity: number): Promise<Product | null> => {
  try {
    // Update the product's stock quantity
    const result = await db.update(productsTable)
      .set({
        stock_quantity: newQuantity,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, productId))
      .returning()
      .execute();

    if (result.length === 0) {
      return null; // Product not found
    }
    
    // Return the updated product
    return {
      ...result[0]
    };
  } catch (error) {
    console.error('Product stock update failed:', error);
    throw error;
  }
};
