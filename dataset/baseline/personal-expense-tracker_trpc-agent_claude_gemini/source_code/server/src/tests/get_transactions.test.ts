import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type TransactionFilter } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test category
  const createTestCategory = async () => {
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();
    return categoryResult[0];
  };

  // Helper function to create test transaction
  const createTestTransaction = async (overrides: any = {}) => {
    const category = await createTestCategory();
    const result = await db.insert(transactionsTable)
      .values({
        description: 'Test Transaction',
        amount: '100.50',
        type: 'expense',
        category_id: category.id,
        transaction_date: new Date('2024-01-15'),
        ...overrides
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should return all transactions when no filter is provided', async () => {
    // Create test data
    await createTestTransaction();
    await createTestTransaction({
      description: 'Second Transaction',
      amount: '50.25',
      type: 'income'
    });

    const results = await getTransactions();

    expect(results).toHaveLength(2);
    expect(results[0].description).toBeDefined();
    expect(typeof results[0].amount).toBe('number');
    expect(results[0].amount).toBeGreaterThan(0);
    expect(results[0].type).toMatch(/^(income|expense)$/);
    expect(results[0].transaction_date).toBeInstanceOf(Date);
  });

  it('should return empty array when no transactions exist', async () => {
    const results = await getTransactions();
    expect(results).toHaveLength(0);
  });

  it('should filter transactions by category_id', async () => {
    const category1 = await createTestCategory();
    const category2 = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        description: 'Another test category'
      })
      .returning()
      .execute();

    // Create transactions for different categories
    await db.insert(transactionsTable)
      .values({
        description: 'Category 1 Transaction',
        amount: '100.00',
        type: 'expense',
        category_id: category1.id,
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        description: 'Category 2 Transaction',
        amount: '200.00',
        type: 'income',
        category_id: category2[0].id,
        transaction_date: new Date('2024-01-16')
      })
      .execute();

    const filter: TransactionFilter = {
      category_id: category1.id
    };

    const results = await getTransactions(filter);

    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Category 1 Transaction');
    expect(results[0].category_id).toBe(category1.id);
  });

  it('should filter transactions by null category_id', async () => {
    const category = await createTestCategory();

    // Create transaction with category
    await db.insert(transactionsTable)
      .values({
        description: 'Transaction with Category',
        amount: '100.00',
        type: 'expense',
        category_id: category.id,
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    // Create transaction without category
    await db.insert(transactionsTable)
      .values({
        description: 'Transaction without Category',
        amount: '200.00',
        type: 'income',
        category_id: null,
        transaction_date: new Date('2024-01-16')
      })
      .execute();

    const filter: TransactionFilter = {
      category_id: null
    };

    const results = await getTransactions(filter);

    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Transaction without Category');
    expect(results[0].category_id).toBeNull();
  });

  it('should filter transactions by date range', async () => {
    await createTestTransaction({
      description: 'Old Transaction',
      transaction_date: new Date('2024-01-01')
    });

    await createTestTransaction({
      description: 'Recent Transaction',
      transaction_date: new Date('2024-01-20')
    });

    await createTestTransaction({
      description: 'Future Transaction',
      transaction_date: new Date('2024-02-01')
    });

    const filter: TransactionFilter = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-25')
    };

    const results = await getTransactions(filter);

    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Recent Transaction');
    expect(results[0].transaction_date).toEqual(new Date('2024-01-20'));
  });

  it('should filter transactions by type', async () => {
    await createTestTransaction({
      description: 'Income Transaction',
      type: 'income',
      amount: '500.00'
    });

    await createTestTransaction({
      description: 'Expense Transaction',
      type: 'expense',
      amount: '300.00'
    });

    const filter: TransactionFilter = {
      type: 'income'
    };

    const results = await getTransactions(filter);

    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Income Transaction');
    expect(results[0].type).toBe('income');
    expect(results[0].amount).toBe(500);
  });

  it('should apply multiple filters correctly', async () => {
    const category = await createTestCategory();

    // Create transactions with various properties
    await db.insert(transactionsTable)
      .values({
        description: 'Matching Transaction',
        amount: '150.75',
        type: 'expense',
        category_id: category.id,
        transaction_date: new Date('2024-01-20')
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        description: 'Wrong Type',
        amount: '200.00',
        type: 'income',
        category_id: category.id,
        transaction_date: new Date('2024-01-20')
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        description: 'Wrong Date',
        amount: '100.00',
        type: 'expense',
        category_id: category.id,
        transaction_date: new Date('2024-02-01')
      })
      .execute();

    const filter: TransactionFilter = {
      category_id: category.id,
      type: 'expense',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-25')
    };

    const results = await getTransactions(filter);

    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('Matching Transaction');
    expect(results[0].amount).toBe(150.75);
    expect(results[0].type).toBe('expense');
    expect(results[0].category_id).toBe(category.id);
  });

  it('should return transactions ordered by date descending', async () => {
    await createTestTransaction({
      description: 'Middle Transaction',
      transaction_date: new Date('2024-01-15')
    });

    await createTestTransaction({
      description: 'Oldest Transaction',
      transaction_date: new Date('2024-01-10')
    });

    await createTestTransaction({
      description: 'Newest Transaction',
      transaction_date: new Date('2024-01-20')
    });

    const results = await getTransactions();

    expect(results).toHaveLength(3);
    expect(results[0].description).toBe('Newest Transaction');
    expect(results[1].description).toBe('Middle Transaction');
    expect(results[2].description).toBe('Oldest Transaction');

    // Verify dates are in descending order
    expect(results[0].transaction_date >= results[1].transaction_date).toBe(true);
    expect(results[1].transaction_date >= results[2].transaction_date).toBe(true);
  });

  it('should convert numeric amount to number correctly', async () => {
    await createTestTransaction({
      amount: '123.45'
    });

    const results = await getTransactions();

    expect(results).toHaveLength(1);
    expect(typeof results[0].amount).toBe('number');
    expect(results[0].amount).toBe(123.45);
    expect(results[0].amount).not.toBe('123.45'); // Ensure it's not a string
  });
});
