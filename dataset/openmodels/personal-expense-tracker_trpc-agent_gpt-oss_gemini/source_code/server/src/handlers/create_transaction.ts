import { type CreateTransactionInput, type Transaction } from '../schema';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Create a new transaction
export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<Transaction> => {
  // Ensure the referenced category exists to avoid FK violations
  const category = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, input.category_id))
    .execute();

  if (category.length === 0) {
    throw new Error(`Category with id ${input.category_id} does not exist`);
  }

  // Insert transaction, converting numeric fields to string for numeric columns
  const result = await db
    .insert(transactionsTable)
    .values({
      amount: input.amount.toString(),
      type: input.type,
      category_id: input.category_id,
      description: input.description ?? null,
      ...(input.transaction_date ? { transaction_date: input.transaction_date } : {}),
    })
    .returning()
    .execute();

  const transaction = result[0];
  // Convert numeric fields back to numbers before returning
  return {
    ...transaction,
    amount: parseFloat(transaction.amount),
  } as Transaction;
};

// Fetch all transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const rows = await db.select().from(transactionsTable).execute();
  // Convert numeric fields back to numbers for each row
  return rows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount),
  })) as Transaction[];
};
