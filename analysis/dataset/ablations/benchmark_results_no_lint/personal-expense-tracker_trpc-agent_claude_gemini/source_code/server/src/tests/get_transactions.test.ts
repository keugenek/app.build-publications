import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();

    expect(result).toEqual([]);
  });

  it('should return all transactions with correct data types', async () => {
    // First create a category (required foreign key)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733'
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          amount: '99.99', // Store as string
          description: 'Test Transaction 1',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15')
        },
        {
          amount: '150.50', // Store as string
          description: 'Test Transaction 2',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    
    // Check first transaction
    const firstTransaction = result.find(t => t.description === 'Test Transaction 1');
    expect(firstTransaction).toBeDefined();
    expect(firstTransaction!.amount).toBe(99.99);
    expect(typeof firstTransaction!.amount).toBe('number');
    expect(firstTransaction!.description).toBe('Test Transaction 1');
    expect(firstTransaction!.type).toBe('expense');
    expect(firstTransaction!.category_id).toBe(categoryId);
    expect(firstTransaction!.transaction_date).toBeInstanceOf(Date);
    expect(firstTransaction!.id).toBeDefined();
    expect(firstTransaction!.created_at).toBeInstanceOf(Date);
    expect(firstTransaction!.updated_at).toBeInstanceOf(Date);

    // Check second transaction
    const secondTransaction = result.find(t => t.description === 'Test Transaction 2');
    expect(secondTransaction).toBeDefined();
    expect(secondTransaction!.amount).toBe(150.50);
    expect(typeof secondTransaction!.amount).toBe('number');
    expect(secondTransaction!.type).toBe('income');
  });

  it('should handle decimal amounts correctly', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Decimal Test Category',
        color: null
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create transaction with specific decimal amount
    await db.insert(transactionsTable)
      .values({
        amount: '12.34', // Store as string
        description: 'Decimal Test',
        type: 'expense',
        category_id: categoryId,
        transaction_date: new Date('2024-01-10')
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(12.34);
    expect(typeof result[0].amount).toBe('number');
  });

  it('should return transactions in database order', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Order Test Category',
        color: '#123456'
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create multiple transactions with different dates
    await db.insert(transactionsTable)
      .values([
        {
          amount: '100.00',
          description: 'First Transaction',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-01')
        },
        {
          amount: '200.00',
          description: 'Second Transaction',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-02')
        },
        {
          amount: '300.00',
          description: 'Third Transaction',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-03')
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    
    // All transactions should be returned
    const descriptions = result.map(t => t.description);
    expect(descriptions).toContain('First Transaction');
    expect(descriptions).toContain('Second Transaction');
    expect(descriptions).toContain('Third Transaction');
    
    // All should have proper numeric conversion
    result.forEach(transaction => {
      expect(typeof transaction.amount).toBe('number');
      expect(transaction.amount).toBeGreaterThan(0);
    });
  });

  it('should handle transactions with different transaction types', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Mixed Type Category',
        color: null
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;

    // Create one income and one expense transaction
    await db.insert(transactionsTable)
      .values([
        {
          amount: '500.00',
          description: 'Income Transaction',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-02-01')
        },
        {
          amount: '250.75',
          description: 'Expense Transaction',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-02-02')
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);

    const incomeTransaction = result.find(t => t.type === 'income');
    const expenseTransaction = result.find(t => t.type === 'expense');

    expect(incomeTransaction).toBeDefined();
    expect(incomeTransaction!.amount).toBe(500.00);
    expect(incomeTransaction!.description).toBe('Income Transaction');

    expect(expenseTransaction).toBeDefined();
    expect(expenseTransaction!.amount).toBe(250.75);
    expect(expenseTransaction!.description).toBe('Expense Transaction');
  });
});
