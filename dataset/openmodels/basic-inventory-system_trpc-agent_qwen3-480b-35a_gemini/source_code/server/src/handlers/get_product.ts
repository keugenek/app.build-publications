import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProduct = async (id: number): Promise<Product | null> => {
  try {
    const result = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const product = result[0];
    return {
      ...product,
      stock_quantity: product.stock_quantity
    };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw error;
  }
};
