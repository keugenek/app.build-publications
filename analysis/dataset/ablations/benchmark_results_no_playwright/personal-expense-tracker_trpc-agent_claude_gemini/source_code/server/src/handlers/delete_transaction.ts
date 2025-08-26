import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTransaction = async (id: number): Promise<boolean> => {
  try {
    // Attempt to delete the transaction by ID
    const result = await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .returning()
      .execute();

    // Return true if a transaction was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
};
