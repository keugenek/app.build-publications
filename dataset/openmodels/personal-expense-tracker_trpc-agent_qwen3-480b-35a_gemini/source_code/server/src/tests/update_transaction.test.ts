import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type UpdateTransactionInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq } from 'drizzle-orm';

describe('updateTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a transaction for testing updates
    await db.insert(transactionsTable).values({
      amount: '100.00',
      date: '2023-01-15',
      description: 'Original transaction',
      type: 'expense',
      category: 'Food'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update a transaction', async () => {
    // Get the transaction ID first
    const transactions = await db.select({ id: transactionsTable.id })
      .from(transactionsTable)
      .where(eq(transactionsTable.description, 'Original transaction'))
      .execute();
    
    const transactionId = transactions[0].id;

    const input: UpdateTransactionInput = {
      id: transactionId,
      amount: 150.00,
      date: new Date('2023-01-20'),
      description: 'Updated transaction',
      type: 'income',
      category: 'Salary'
    };

    const result = await updateTransaction(input);

    // Validate the returned transaction
    expect(result.id).toEqual(transactionId);
    expect(result.amount).toEqual(150.00);
    expect(result.date).toEqual(new Date('2023-01-20'));
    expect(result.description).toEqual('Updated transaction');
    expect(result.type).toEqual('income');
    expect(result.category).toEqual('Salary');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Get the transaction ID first
    const transactions = await db.select({ id: transactionsTable.id })
      .from(transactionsTable)
      .where(eq(transactionsTable.description, 'Original transaction'))
      .execute();
    
    const transactionId = transactions[0].id;

    // Only update the amount
    const input: UpdateTransactionInput = {
      id: transactionId,
      amount: 200.00
    };

    const result = await updateTransaction(input);

    // Validate that only amount changed
    expect(result.id).toEqual(transactionId);
    expect(result.amount).toEqual(200.00);
    // Other fields should remain unchanged
    expect(result.date).toEqual(new Date('2023-01-15'));
    expect(result.description).toEqual('Original transaction');
    expect(result.type).toEqual('expense');
    expect(result.category).toEqual('Food');
  });

  it('should throw error for non-existent transaction', async () => {
    const input: UpdateTransactionInput = {
      id: 999, // Non-existent ID
      amount: 150.00
    };

    await expect(updateTransaction(input)).rejects.toThrow(/Transaction with id 999 not found/);
  });
});
