import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        amount: input.amount.toString(), // Convert number to string for numeric column
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        description: input.description,
        type: input.type,
        category: input.category
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert string back to number
      date: new Date(transaction.date) // Convert string back to Date object
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
