import { db } from '../db';
import { transactionsTable, productsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // First, verify that the product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        product_id: input.product_id,
        type: input.type,
        quantity: input.quantity,
        reference: input.reference,
        notes: input.notes
      })
      .returning()
      .execute();

    const transaction = result[0];
    return {
      ...transaction,
      reference: transaction.reference || null,
      notes: transaction.notes || null
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
