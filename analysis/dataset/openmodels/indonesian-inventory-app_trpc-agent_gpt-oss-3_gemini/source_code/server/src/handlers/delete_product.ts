import { type Product } from '../schema';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Deletes a product by its ID and returns the deleted product data.
 * Throws an error if the product does not exist or the ID format is invalid.
 */
export const deleteProduct = async (id: string): Promise<Product> => {
  // Simple UUID validation (RFC 4122)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Product not found');
  }

  try {
    // Perform delete and return the deleted row
    const result = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning()
      .execute();

    const deleted = result[0];
    if (!deleted) {
      throw new Error('Product not found');
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...deleted,
      harga_satuan: parseFloat(deleted.harga_satuan as any),
    } as Product;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
