import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .execute();

    return results.map(transaction => ({
      ...transaction,
      created_at: transaction.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};
