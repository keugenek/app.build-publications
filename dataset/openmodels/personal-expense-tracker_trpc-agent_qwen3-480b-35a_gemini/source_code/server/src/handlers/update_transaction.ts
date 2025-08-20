import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type UpdateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    // Build the update data object with only provided fields
    const updateData: any = {};
    
    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    // Update transaction record
    const result = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert string back to number
      date: new Date(transaction.date), // Convert string back to Date
      created_at: transaction.created_at
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
};
