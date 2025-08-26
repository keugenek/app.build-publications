import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch all products from the database
    const results = await db.select({
      id: productsTable.id,
      name: productsTable.name,
      sku: productsTable.sku,
      stockLevel: productsTable.stockLevel,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
      .from(productsTable)
      .execute();

    // Convert numeric fields to proper types before returning
    return results.map(product => ({
      ...product,
      stockLevel: Number(product.stockLevel),
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
