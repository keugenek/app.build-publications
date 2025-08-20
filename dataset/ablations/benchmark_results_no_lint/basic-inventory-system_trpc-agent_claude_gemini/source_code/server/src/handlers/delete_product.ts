import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    // Attempt to delete the product with the given ID
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
}
