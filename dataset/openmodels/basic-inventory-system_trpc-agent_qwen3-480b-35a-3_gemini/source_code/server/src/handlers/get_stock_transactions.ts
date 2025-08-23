import { db } from '../db';
import { stockTransactionsTable } from '../db/schema';
import { type StockTransaction } from '../schema';

export const getStockTransactions = async (): Promise<StockTransaction[]> => {
  try {
    // Fetch all stock transactions from the database
    const transactions = await db.select()
      .from(stockTransactionsTable)
      .execute();
    
    // Map the database results to the expected schema type
    return transactions.map(transaction => ({
      id: transaction.id,
      productId: transaction.productId,
      quantity: transaction.quantity,
      transactionType: transaction.transactionType as 'STOCK_IN' | 'STOCK_OUT',
      transactionDate: transaction.transactionDate
    }));
  } catch (error) {
    console.error('Failed to fetch stock transactions:', error);
    throw error;
  }
};
