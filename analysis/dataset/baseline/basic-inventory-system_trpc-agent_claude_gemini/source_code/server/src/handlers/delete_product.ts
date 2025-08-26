import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type DeleteProductInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (input: DeleteProductInput): Promise<void> => {
  try {
    // First, check if the product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Delete related stock transactions first (cascade delete)
    await db.delete(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, input.id))
      .execute();

    // Delete the product
    await db.delete(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
