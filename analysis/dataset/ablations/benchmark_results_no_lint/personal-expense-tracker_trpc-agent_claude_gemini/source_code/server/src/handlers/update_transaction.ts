import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type UpdateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    // Check if transaction exists
    const existingTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, input.id))
      .execute();

    if (existingTransaction.length === 0) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    // If category_id is being updated, verify the category exists
    if (input.category_id !== undefined) {
      const existingCategory = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (existingCategory.length === 0) {
        throw new Error(`Category with id ${input.category_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateFields: any = {
      updated_at: new Date()
    };

    if (input.amount !== undefined) {
      updateFields.amount = input.amount.toString();
    }
    if (input.description !== undefined) {
      updateFields.description = input.description;
    }
    if (input.type !== undefined) {
      updateFields.type = input.type;
    }
    if (input.category_id !== undefined) {
      updateFields.category_id = input.category_id;
    }
    if (input.transaction_date !== undefined) {
      updateFields.transaction_date = input.transaction_date;
    }

    // Update transaction record
    const result = await db.update(transactionsTable)
      .set(updateFields)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
};
