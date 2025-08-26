import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        type: input.type,
        category_id: input.category_id,
        transaction_date: input.transaction_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
