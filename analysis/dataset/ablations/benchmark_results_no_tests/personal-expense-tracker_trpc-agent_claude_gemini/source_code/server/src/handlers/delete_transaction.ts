import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTransaction = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First verify the transaction exists
    const existingTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();

    if (existingTransaction.length === 0) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    // Delete the transaction
    const result = await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
};
