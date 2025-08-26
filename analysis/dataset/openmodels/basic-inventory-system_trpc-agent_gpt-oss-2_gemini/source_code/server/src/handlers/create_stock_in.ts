import { db } from '../db';
import { eq } from 'drizzle-orm';
import { stockInTable, productsTable } from '../db/schema';
import { type CreateStockInInput, type StockIn } from '../schema';

/**
 * Handler for creating a stock‑in transaction.
 * It inserts a record into the `stock_in` table and increments the related
 * product's `stock_quantity`.
 *
 * All numeric fields are stored as integers, so no string ↔ number conversion
 * is required.
 */
export const createStockIn = async (input: CreateStockInInput): Promise<StockIn> => {
  try {
    // Ensure the product exists
    const productRows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (productRows.length === 0) {
      throw new Error(`Product with id ${input.product_id} does not exist`);
    }

    const product = productRows[0];

    // Insert the stock‑in transaction
    const insertRows = await db
      .insert(stockInTable)
      .values({
        product_id: input.product_id,
        quantity: input.quantity,
        transaction_date: input.transaction_date ?? new Date(),
      })
      .returning()
      .execute();

    const newStockIn = insertRows[0];

    // Update the product's stock quantity
    await db
      .update(productsTable)
      .set({
        stock_quantity: product.stock_quantity + input.quantity,
      })
      .where(eq(productsTable.id, input.product_id))
      .execute();

    // Return the freshly inserted record
    return newStockIn as StockIn;
  } catch (error) {
    console.error('Failed to create stock‑in transaction:', error);
    throw error;
  }
};
