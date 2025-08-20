import { type CreateTransactionInput, type Transaction } from '../schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { itemsTable, transactionsTable } from '../db/schema';

/**
 * Fetch all transaction records from the database.
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  const rows = await db.select().from(transactionsTable).execute();
  // Transactions have no numeric columns that require conversion.
  return rows;
};

/**
 * Create a new transaction (stock in/out) and adjust the associated item's stock.
 */
export const createTransaction = async (
  input: CreateTransactionInput
): Promise<Transaction> => {
  try {
    // Insert transaction record
    const [transaction] = await db
      .insert(transactionsTable)
      .values({
        item_id: input.item_id,
        date: input.date,
        quantity: input.quantity,
        note: input.note ?? null,
        type: input.type
      })
      .returning()
      .execute();

    // Retrieve current item stock
    const [item] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, input.item_id))
      .execute();

    // Adjust stock based on transaction type
    const adjustment = input.type === 'masuk' ? input.quantity : -input.quantity;
    const newStock = (item.stock ?? 0) + adjustment;

    // Update item stock
    await db
      .update(itemsTable)
      .set({ stock: newStock })
      .where(eq(itemsTable.id, input.item_id))
      .execute();

    return transaction;
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
