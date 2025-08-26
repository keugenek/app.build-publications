import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

// Test data
const testTransaction1: CreateTransactionInput = {
  amount: 100.50,
  date: new Date('2023-01-15'),
  description: 'Grocery shopping',
  type: 'expense',
  category: 'Food'
};

const testTransaction2: CreateTransactionInput = {
  amount: 2500.00,
  date: new Date('2023-01-20'),
  description: 'Monthly salary',
  type: 'income',
  category: 'Salary'
};

describe('getTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(transactionsTable).values({
      amount: testTransaction1.amount.toString(),
      date: testTransaction1.date.toISOString().split('T')[0], // Convert to string format for database
      description: testTransaction1.description,
      type: testTransaction1.type,
      category: testTransaction1.category
    }).execute();
    
    await db.insert(transactionsTable).values({
      amount: testTransaction2.amount.toString(),
      date: testTransaction2.date.toISOString().split('T')[0], // Convert to string format for database
      description: testTransaction2.description,
      type: testTransaction2.type,
      category: testTransaction2.category
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all transactions', async () => {
    const transactions = await getTransactions();

    expect(transactions).toHaveLength(2);
    
    // Check first transaction
    const groceryTransaction = transactions.find(t => t.description === 'Grocery shopping');
    expect(groceryTransaction).toBeDefined();
    expect(groceryTransaction!.amount).toBe(100.50);
    expect(groceryTransaction!.type).toBe('expense');
    expect(groceryTransaction!.category).toBe('Food');
    expect(groceryTransaction!.date).toEqual(new Date('2023-01-15'));
    expect(groceryTransaction!.id).toBeDefined();
    expect(groceryTransaction!.created_at).toBeInstanceOf(Date);
    
    // Check second transaction
    const salaryTransaction = transactions.find(t => t.description === 'Monthly salary');
    expect(salaryTransaction).toBeDefined();
    expect(salaryTransaction!.amount).toBe(2500.00);
    expect(salaryTransaction!.type).toBe('income');
    expect(salaryTransaction!.category).toBe('Salary');
    expect(salaryTransaction!.date).toEqual(new Date('2023-01-20'));
    expect(salaryTransaction!.id).toBeDefined();
    expect(salaryTransaction!.created_at).toBeInstanceOf(Date);
  });

  it('should return numeric fields as numbers', async () => {
    const transactions = await getTransactions();
    
    expect(transactions).toHaveLength(2);
    
    transactions.forEach(transaction => {
      // Verify amount is a number type (not string)
      expect(typeof transaction.amount).toBe('number');
      expect(transaction.amount).toBeGreaterThan(0);
    });
  });

  it('should return empty array when no transactions exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const transactions = await getTransactions();
    
    expect(transactions).toHaveLength(0);
    expect(transactions).toEqual([]);
  });
});
