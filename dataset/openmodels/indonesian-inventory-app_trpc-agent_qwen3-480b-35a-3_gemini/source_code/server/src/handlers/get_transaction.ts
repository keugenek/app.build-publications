import { db } from '../db';
import { transactionsTable, productsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const getTransaction = async (id: number): Promise<Transaction | null> => {
  try {
    const result = await db.select({
      id: transactionsTable.id,
      product_id: transactionsTable.product_id,
      type: transactionsTable.type,
      quantity: transactionsTable.quantity,
      reference: transactionsTable.reference,
      notes: transactionsTable.notes,
      created_at: transactionsTable.created_at
    })
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const transaction = result[0];
    return {
      ...transaction,
      created_at: transaction.created_at
    };
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    throw error;
  }
};
