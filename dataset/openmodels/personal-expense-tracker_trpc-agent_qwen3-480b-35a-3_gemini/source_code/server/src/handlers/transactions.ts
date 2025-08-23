import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateTransactionInput, type UpdateTransactionInput, type Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const results = await db.select().from(transactionsTable).execute();
    
    // Convert numeric fields back to numbers and handle date conversion
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount),
      date: new Date(transaction.date) // Convert string date to Date object
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};

export const getTransactionById = async (id: number): Promise<Transaction | null> => {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();
    
    if (results.length === 0) {
      return null;
    }
    
    // Convert numeric fields back to numbers and handle date conversion
    const transaction = results[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount),
      date: new Date(transaction.date) // Convert string date to Date object
    };
  } catch (error) {
    console.error(`Failed to fetch transaction with id ${id}:`, error);
    throw error;
  }
};

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // First check if the category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.categoryId))
      .execute();
      
    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.categoryId} does not exist`);
    }
    
    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        amount: input.amount.toString(), // Convert number to string for numeric column
        type: input.type,
        description: input.description,
        date: input.date.toISOString().split('T')[0], // Convert Date to string format 'YYYY-MM-DD'
        categoryId: input.categoryId
      })
      .returning()
      .execute();
    
    // Convert numeric fields back to numbers and handle date conversion
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount),
      date: new Date(transaction.date) // Convert string date to Date object
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};

export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    // Check if the transaction exists
    const existingTransaction = await getTransactionById(input.id);
    if (!existingTransaction) {
      throw new Error(`Transaction with id ${input.id} does not exist`);
    }
    
    // If categoryId is being updated, check if the category exists
    if (input.categoryId !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.categoryId))
        .execute();
        
      if (categoryExists.length === 0) {
        throw new Error(`Category with id ${input.categoryId} does not exist`);
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (input.amount !== undefined) updateData.amount = input.amount.toString();
    if (input.type !== undefined) updateData.type = input.type;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.date !== undefined) updateData.date = input.date.toISOString().split('T')[0];
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    
    // Update transaction record
    const result = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();
    
    // Convert numeric fields back to numbers and handle date conversion
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount),
      date: new Date(transaction.date) // Convert string date to Date object
    };
  } catch (error) {
    console.error(`Transaction update failed for id ${input.id}:`, error);
    throw error;
  }
};

export const deleteTransaction = async (id: number): Promise<boolean> => {
  try {
    const result: any = await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();
    
    // Return true if a row was deleted, false otherwise
    // Note: The exact property might vary depending on the database driver
    return result.rowCount > 0 || result.count > 0;
  } catch (error) {
    console.error(`Transaction deletion failed for id ${id}:`, error);
    throw error;
  }
};
