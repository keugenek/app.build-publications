import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    // First, delete all related stock movements to avoid foreign key constraint violations
    await db.delete(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, id))
      .execute();

    // Then delete the product
    const result = await db.delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning()
      .execute();

    // Return true if a product was deleted, false if no product was found
    return result.length > 0;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
