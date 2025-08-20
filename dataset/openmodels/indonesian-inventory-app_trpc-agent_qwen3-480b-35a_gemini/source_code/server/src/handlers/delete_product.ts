import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<Product> => {
  try {
    // First, fetch the product to return its data before deletion
    const productResult = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (productResult.length === 0) {
      throw new Error(`Product with id ${id} not found`);
    }

    const product = productResult[0];
    
    // Delete the product
    await db.delete(productsTable)
      .where(eq(productsTable.id, id))
      .execute();
    
    // Return the deleted product data
    return {
      ...product,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};