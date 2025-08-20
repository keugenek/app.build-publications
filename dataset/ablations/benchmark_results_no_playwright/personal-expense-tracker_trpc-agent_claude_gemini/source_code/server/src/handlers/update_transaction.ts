import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type UpdateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    // First, verify the transaction exists
    const existingTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, input.id))
      .execute();

    if (existingTransaction.length === 0) {
      throw new Error('Transaction not found');
    }

    // If category_id is provided, verify it exists
    if (input.category_id !== undefined && input.category_id !== null) {
      const existingCategory = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (existingCategory.length === 0) {
        throw new Error('Category not found');
      }
    }

    // Build the update object with only provided fields
    const updateData: any = {};
    if (input.type !== undefined) updateData.type = input.type;
    if (input.amount !== undefined) updateData.amount = input.amount.toString();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;

    // Update the transaction
    const result = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedTransaction = result[0];
    return {
      ...updatedTransaction,
      amount: parseFloat(updatedTransaction.amount)
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
};
