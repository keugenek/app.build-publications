import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { desc } from 'drizzle-orm';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Query all transactions ordered by date (most recent first)
    const results = await db.select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.date))
      .execute();

    // Convert numeric fields from string to number
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert numeric field to number
    }));
  } catch (error) {
    console.error('Get transactions failed:', error);
    throw error;
  }
};
