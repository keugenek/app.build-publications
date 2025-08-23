import { db } from '../db';
import { eq } from 'drizzle-orm';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput, type UpdateTransactionInput, type Transaction } from '../schema';

/** Create a new transaction in the database */
export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    const result = await db
      .insert(transactionsTable)
      .values({
        amount: input.amount.toString(), // numeric column stored as string
        description: input.description ?? null,
        date: input.date,
        category_id: input.category_id,
        type: input.type,
      })
      .returning()
      .execute();

    const row = result[0];
    return {
      ...row,
      amount: parseFloat(row.amount), // convert back to number
    } as Transaction;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
};

/** Fetch all transactions from the database */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const rows = await db.select().from(transactionsTable).execute();
    return rows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount),
    })) as Transaction[];
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
};

/** Update an existing transaction */
export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    const updateData: Partial<typeof transactionsTable.$inferInsert> = {};

    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString();
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.date !== undefined) {
      updateData.date = input.date;
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    const result = await db
      .update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    const row = result[0];
    return {
      ...row,
      amount: parseFloat(row.amount),
    } as Transaction;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
};
