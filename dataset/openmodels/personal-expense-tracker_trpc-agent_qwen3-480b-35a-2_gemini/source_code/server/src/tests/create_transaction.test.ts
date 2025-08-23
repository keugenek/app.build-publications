import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTransactionInput = {
  category_id: 1,
  amount: 29.99,
  description: 'Test transaction',
  date: new Date('2023-12-01')
};

describe('createTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first since transaction references it
    await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a transaction', async () => {
    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.category_id).toEqual(testInput.category_id);
    expect(result.amount).toEqual(29.99);
    expect(result.description).toEqual(testInput.description);
    expect(result.date).toEqual(testInput.date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const result = await createTransaction(testInput);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].category_id).toEqual(testInput.category_id);
    expect(parseFloat(transactions[0].amount)).toEqual(29.99);
    expect(transactions[0].description).toEqual(testInput.description);
    expect(transactions[0].date).toEqual(testInput.date);
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable description field', async () => {
    const inputWithoutDescription: CreateTransactionInput = {
      category_id: 1,
      amount: 15.50,
      description: null,
      date: new Date('2023-12-02')
    };

    const result = await createTransaction(inputWithoutDescription);
    
    expect(result.description).toBeNull();
    
    // Verify in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();
      
    expect(transactions[0].description).toBeNull();
  });
});
