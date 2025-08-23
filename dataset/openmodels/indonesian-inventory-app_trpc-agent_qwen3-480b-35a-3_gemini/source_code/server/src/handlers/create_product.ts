import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        code: input.code,
        name: input.name,
        description: input.description,
        purchase_price: input.purchase_price.toString(), // Convert number to string for numeric column
        selling_price: input.selling_price.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity // Integer column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      purchase_price: parseFloat(product.purchase_price), // Convert string back to number
      selling_price: parseFloat(product.selling_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
