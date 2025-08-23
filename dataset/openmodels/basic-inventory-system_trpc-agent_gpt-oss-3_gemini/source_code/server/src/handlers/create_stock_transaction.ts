import { db } from '../db';
import { stock_transactions, products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateStockTransactionInput, type StockTransaction, type TransactionType } from '../schema';

/**
 * Creates a stock transaction (stock_in or stock_out) and updates the associated product's stock quantity.
 *
 * - Inserts a new record into the `stock_transactions` table.
 * - Adjusts the `stock_quantity` of the related product based on the transaction type.
 *   * `stock_in`  → adds the quantity to the current stock.
 *   * `stock_out` → subtracts the quantity from the current stock (cannot go below 0).
 *
 * Throws an error if the referenced product does not exist or if a `stock_out` would result in a negative stock level.
 */
export const createStockTransaction = async (
  input: CreateStockTransactionInput,
): Promise<StockTransaction> => {
  try {
    // 1️⃣ Fetch the product to ensure it exists and obtain current stock
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, input.product_id))
      .execute();

    if (productResult.length === 0) {
      throw new Error(`Product with id ${input.product_id} does not exist`);
    }

    const product = productResult[0];

    // 2️⃣ Compute new stock based on transaction type
    let newStockQuantity: number;
    if (input.type === 'stock_in') {
      newStockQuantity = product.stock_quantity + input.quantity;
    } else {
      // stock_out – ensure we don't go negative
      if (product.stock_quantity < input.quantity) {
        throw new Error('Insufficient stock for stock_out transaction');
      }
      newStockQuantity = product.stock_quantity - input.quantity;
    }

    // 3️⃣ Insert the transaction record
    const transactionResult = await db
      .insert(stock_transactions)
      .values({
        product_id: input.product_id,
        type: input.type as TransactionType,
        quantity: input.quantity,
      })
      .returning()
      .execute();

    const transaction = transactionResult[0];

    // 4️⃣ Update the product's stock_quantity
    await db
      .update(products)
      .set({ stock_quantity: newStockQuantity })
      .where(eq(products.id, input.product_id))
      .execute();

    // 5️⃣ Return the inserted transaction (drizzle returns numeric fields as numbers already)
    return transaction;
  } catch (error) {
    console.error('Failed to create stock transaction:', error);
    throw error;
  }
};
