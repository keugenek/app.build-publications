import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';

/**
 * Fetch all transactions from the database.
 * Returns an array of {@link Transaction} objects.
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const rows = await db.select().from(transactionsTable).execute();
    // Cast the enum string to the specific Transaction enum type
    return rows.map((t) => ({
      ...t,
      jenis: t.jenis as 'masuk' | 'keluar',
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};
