import { db } from '../db';
import { stockTransactionsTable } from '../db/schema';
import { type StockTransaction } from '../schema';

export const getStockTransactions = async (): Promise<StockTransaction[]> => {
  try {
    // Fetch all stock transactions from the database
    const transactions = await db.select()
      .from(stockTransactionsTable)
      .execute();

    // Map the database results to match the StockTransaction schema
    return transactions.map(transaction => ({
      id: transaction.id,
      product_id: transaction.product_id,
      transaction_type: transaction.transaction_type as 'IN' | 'OUT',
      quantity: transaction.quantity,
      notes: transaction.notes,
      created_at: transaction.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch stock transactions:', error);
    throw error;
  }
};
