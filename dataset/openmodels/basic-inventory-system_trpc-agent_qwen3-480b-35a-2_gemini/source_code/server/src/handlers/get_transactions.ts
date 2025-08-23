import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Fetch all transactions from the database
    const results = await db.select()
      .from(transactionsTable)
      .execute();

    // Convert date fields to Date objects and return
    return results.map(transaction => ({
      ...transaction,
      transaction_date: new Date(transaction.transaction_date),
      created_at: new Date(transaction.created_at)
    }));
  } catch (error) {
    console.error('Fetching transactions failed:', error);
    throw error;
  }
};
