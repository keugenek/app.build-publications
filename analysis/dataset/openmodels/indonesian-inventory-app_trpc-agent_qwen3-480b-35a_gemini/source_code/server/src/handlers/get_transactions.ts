import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .orderBy(transactionsTable.created_at)
      .execute();

    return results.map(transaction => ({
      ...transaction,
      transaction_date: new Date(transaction.transaction_date)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};