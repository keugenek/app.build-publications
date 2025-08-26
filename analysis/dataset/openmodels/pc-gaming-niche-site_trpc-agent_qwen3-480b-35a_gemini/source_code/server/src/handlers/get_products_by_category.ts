import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  try {
    // Query products by category ID
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.category_id, categoryId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : null
    }));
  } catch (error) {
    console.error('Failed to fetch products by category:', error);
    throw error;
  }
};
