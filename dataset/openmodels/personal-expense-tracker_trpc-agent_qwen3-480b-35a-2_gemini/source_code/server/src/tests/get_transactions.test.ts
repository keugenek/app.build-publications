import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';
import { eq } from 'drizzle-orm';

describe('getTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test category first (needed for foreign key constraint)
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Insert test transactions
    await db.insert(transactionsTable).values([
      {
        category_id: categoryId,
        amount: '29.99',
        description: 'Test transaction 1',
        date: new Date('2023-01-15'),
      },
      {
        category_id: categoryId,
        amount: '45.50',
        description: 'Test transaction 2',
        date: new Date('2023-01-20'),
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should fetch all transactions', async () => {
    const transactions = await getTransactions();

    expect(transactions).toHaveLength(2);
    
    // Check first transaction
    expect(transactions[0]).toEqual({
      id: expect.any(Number),
      category_id: expect.any(Number),
      amount: 29.99,
      description: 'Test transaction 1',
      date: new Date('2023-01-15'),
      created_at: expect.any(Date)
    });
    
    // Check second transaction
    expect(transactions[1]).toEqual({
      id: expect.any(Number),
      category_id: expect.any(Number),
      amount: 45.50,
      description: 'Test transaction 2',
      date: new Date('2023-01-20'),
      created_at: expect.any(Date)
    });
    
    // Verify numeric conversion
    expect(typeof transactions[0].amount).toBe('number');
    expect(typeof transactions[1].amount).toBe('number');
  });

  it('should return empty array when no transactions exist', async () => {
    // Clear all transactions
    await db.delete(transactionsTable).execute();
    
    const transactions = await getTransactions();
    
    expect(transactions).toHaveLength(0);
    expect(transactions).toEqual([]);
  });

  it('should handle transactions with null descriptions', async () => {
    // Create a category for this test
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category 2' })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Insert a transaction with null description
    await db.insert(transactionsTable).values({
      category_id: categoryId,
      amount: '15.75',
      description: null,
      date: new Date('2023-02-01'),
    }).execute();
    
    const transactions = await getTransactions();
    
    expect(transactions).toHaveLength(3);
    
    const nullDescriptionTransaction = transactions.find(t => t.amount === 15.75);
    expect(nullDescriptionTransaction).toBeDefined();
    expect(nullDescriptionTransaction?.description).toBeNull();
  });
});
