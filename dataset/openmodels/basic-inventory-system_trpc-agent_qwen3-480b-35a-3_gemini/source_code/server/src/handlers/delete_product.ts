import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning({ id: productsTable.id })
      .execute();

    // Returns true if a product was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
