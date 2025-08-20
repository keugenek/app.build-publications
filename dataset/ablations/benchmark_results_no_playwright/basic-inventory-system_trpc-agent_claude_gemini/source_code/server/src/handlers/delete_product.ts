import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteProductInput } from '../schema';

export const deleteProduct = async (input: DeleteProductInput): Promise<boolean> => {
  try {
    // Delete the product - CASCADE will automatically delete associated transactions
    const result = await db.delete(productsTable)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Return true if a product was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
