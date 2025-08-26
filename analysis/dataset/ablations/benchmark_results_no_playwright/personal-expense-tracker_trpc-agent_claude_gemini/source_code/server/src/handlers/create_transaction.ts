import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Validate category exists if category_id is provided
    if (input.category_id !== null) {
      const existingCategory = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();
      
      if (existingCategory.length === 0) {
        throw new Error(`Category with id ${input.category_id} does not exist`);
      }
    }

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        type: input.type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        date: input.date,
        category_id: input.category_id
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
