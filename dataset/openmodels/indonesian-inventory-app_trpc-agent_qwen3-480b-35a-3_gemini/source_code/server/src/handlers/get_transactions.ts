import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Fetch all transactions from the database
    const results = await db.select()
      .from(transactionsTable)
      .orderBy(transactionsTable.created_at)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(transaction => ({
      ...transaction,
      quantity: parseInt(transaction.quantity.toString()) // Ensure quantity is a number
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};
