import { type Transaction } from '../schema';
import { db } from '../db';
import { transactionsTable } from '../db/schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Fetch all transactions from the database
    const rows = await db
      .select()
      .from(transactionsTable)
      .execute();
    // Convert numeric fields (amount) from string to number
    return rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount as unknown as string), // numeric column returns string
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
  };
