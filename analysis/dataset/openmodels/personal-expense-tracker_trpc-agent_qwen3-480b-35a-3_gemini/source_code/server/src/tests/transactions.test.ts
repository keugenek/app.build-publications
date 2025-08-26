import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput, type UpdateTransactionInput } from '../schema';
import { getTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction } from '../handlers/transactions';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Custom createDB function that only creates the tables we need
const createTransactionsDB = async () => {
  // Create only categories and transactions tables
  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      amount NUMERIC(12,2) NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id)
    )`
  ];
  
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
};

describe('transaction handlers', () => {
  beforeEach(async () => {
    await resetDB();
    await createTransactionsDB();
    // Create a test category directly in the database
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        type: 'expense'
      })
      .execute();
  });
  
  afterEach(resetDB);

  describe('getTransactions', () => {
    it('should return an empty array when no transactions exist', async () => {
      const result = await getTransactions();
      expect(result).toEqual([]);
    });

    it('should return all transactions', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      // Create a few test transactions
      await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });
      
      await createTransaction({
        amount: 150.00,
        type: 'expense',
        description: 'Second test transaction',
        date: new Date('2023-01-16'),
        categoryId
      });
      
      const result = await getTransactions();
      expect(result).toHaveLength(2);
      
      // Check first transaction
      expect(result[0].amount).toBe(99.99);
      expect(result[0].type).toBe('expense');
      expect(result[0].description).toBe('Test transaction');
      expect(result[0].categoryId).toBe(categoryId);
      expect(result[0].id).toBeDefined();
      expect(result[0].date).toEqual(new Date('2023-01-15'));
      
      // Check second transaction
      expect(result[1].amount).toBe(150.00);
      expect(result[1].description).toBe('Second test transaction');
      expect(result[1].date).toEqual(new Date('2023-01-16'));
    });
  });

  describe('getTransactionById', () => {
    it('should return null when transaction does not exist', async () => {
      const result = await getTransactionById(999);
      expect(result).toBeNull();
    });

    it('should return a transaction by id', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const createdTransaction = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });
      
      const result = await getTransactionById(createdTransaction.id);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdTransaction.id);
      expect(result?.amount).toBe(99.99);
      expect(result?.type).toBe('expense');
      expect(result?.description).toBe('Test transaction');
      expect(result?.categoryId).toBe(categoryId);
      expect(result?.date).toEqual(new Date('2023-01-15'));
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const result = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });

      // Basic field validation
      expect(result.amount).toBe(99.99);
      expect(result.type).toBe('expense');
      expect(result.description).toBe('Test transaction');
      expect(result.categoryId).toBe(categoryId);
      expect(result.id).toBeDefined();
      expect(result.date).toEqual(new Date('2023-01-15'));
      
      // Verify numeric conversion
      expect(typeof result.amount).toBe('number');
    });

    it('should save transaction to database', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const result = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });

      // Query using proper drizzle syntax
      const transactions = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, result.id))
        .execute();

      expect(transactions).toHaveLength(1);
      expect(parseFloat(transactions[0].amount)).toBe(99.99);
      expect(transactions[0].type).toBe('expense');
      expect(transactions[0].description).toBe('Test transaction');
      expect(transactions[0].categoryId).toBe(categoryId);
      expect(new Date(transactions[0].date)).toEqual(new Date('2023-01-15'));
    });
    
    it('should fail to create transaction with non-existent category', async () => {
      await expect(createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId: 999 // Non-existent category
      })).rejects.toThrow(/does not exist/);
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const createdTransaction = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });
      
      const updateInput: UpdateTransactionInput = {
        id: createdTransaction.id,
        amount: 199.99,
        description: 'Updated transaction'
      };
      
      const result = await updateTransaction(updateInput);
      
      expect(result.id).toBe(createdTransaction.id);
      expect(result.amount).toBe(199.99);
      expect(result.type).toBe('expense'); // Unchanged
      expect(result.description).toBe('Updated transaction');
      expect(result.categoryId).toBe(categoryId); // Unchanged
      
      // Verify numeric conversion
      expect(typeof result.amount).toBe('number');
    });
    
    it('should update transaction in database', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const createdTransaction = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });
      
      const updateInput: UpdateTransactionInput = {
        id: createdTransaction.id,
        amount: 199.99,
        description: 'Updated transaction'
      };
      
      await updateTransaction(updateInput);
      
      // Query the updated transaction
      const transactions = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, createdTransaction.id))
        .execute();
      
      expect(transactions).toHaveLength(1);
      expect(parseFloat(transactions[0].amount)).toBe(199.99);
      expect(transactions[0].description).toBe('Updated transaction');
    });
    
    it('should fail to update non-existent transaction', async () => {
      const updateInput: UpdateTransactionInput = {
        id: 999, // Non-existent transaction
        amount: 199.99
      };
      
      await expect(updateTransaction(updateInput)).rejects.toThrow(/does not exist/);
    });
    
    it('should fail to update with non-existent category', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const createdTransaction = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });
      
      const updateInput: UpdateTransactionInput = {
        id: createdTransaction.id,
        categoryId: 999 // Non-existent category
      };
      
      await expect(updateTransaction(updateInput)).rejects.toThrow(/does not exist/);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction', async () => {
      // Get the category we created
      const categories = await db.select().from(categoriesTable).execute();
      const categoryId = categories[0].id;
      
      const createdTransaction = await createTransaction({
        amount: 99.99,
        type: 'expense',
        description: 'Test transaction',
        date: new Date('2023-01-15'),
        categoryId
      });
      
      const result = await deleteTransaction(createdTransaction.id);
      expect(result).toBe(true);
      
      // Verify transaction is deleted
      const transaction = await getTransactionById(createdTransaction.id);
      expect(transaction).toBeNull();
    });
    
    it('should return false when deleting non-existent transaction', async () => {
      const result = await deleteTransaction(999);
      expect(result).toBe(false);
    });
  });
});
