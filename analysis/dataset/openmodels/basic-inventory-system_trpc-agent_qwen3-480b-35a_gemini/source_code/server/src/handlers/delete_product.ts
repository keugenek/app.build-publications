import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<Product> => {
  try {
    // First, check if product exists and get its data
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with id ${id} not found`);
    }

    const existingProduct = existingProducts[0];

    // Delete the product
    await db.delete(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    // Return the deleted product data
    return {
      id: existingProduct.id,
      name: existingProduct.name,
      sku: existingProduct.sku,
      stock_quantity: existingProduct.stock_quantity,
      created_at: existingProduct.created_at,
      updated_at: existingProduct.updated_at
    };
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
