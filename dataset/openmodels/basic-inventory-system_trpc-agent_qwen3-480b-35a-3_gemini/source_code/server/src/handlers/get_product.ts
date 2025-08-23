import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProduct = async (id: number): Promise<Product> => {
  try {
    const result = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      throw new Error(`Product with id ${id} not found`);
    }

    const product = result[0];
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockLevel: product.stockLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  } catch (error) {
    console.error('Failed to get product:', error);
    throw error;
  }
};
