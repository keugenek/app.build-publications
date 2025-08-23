import { type CreateStockOutInput, type StockOut } from '../schema';
import { db } from '../db';
import { sql, eq } from 'drizzle-orm';
import { productsTable, stockOutTable } from '../db/schema';

/**
 * Handler for creating a stock-out transaction.
 * Inserts a new record into `stock_out` and decrements the related product's
 * `stock_quantity`. Returns the created StockOut record.
 */
export const createStockOut = async (input: CreateStockOutInput): Promise<StockOut> => {
  try {
    // Insert the stock-out transaction
    const [stockOut] = await db
      .insert(stockOutTable)
      .values({
        product_id: input.product_id,
        quantity: input.quantity,
        transaction_date: input.transaction_date ?? new Date(),
      })
      .returning()
      .execute();

    // Decrement the product's stock_quantity atomically
    await db
      .update(productsTable)
      .set({
        stock_quantity: sql`${productsTable.stock_quantity} - ${input.quantity}`,
      })
      .where(eq(productsTable.id, input.product_id))
      .execute();

    return stockOut as StockOut;
  } catch (error) {
    console.error('Stock out creation failed:', error);
    throw error;
  }
};
