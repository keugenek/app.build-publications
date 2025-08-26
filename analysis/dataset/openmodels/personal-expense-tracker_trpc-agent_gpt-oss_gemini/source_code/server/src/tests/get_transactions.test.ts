import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { getTransactions } from '../handlers/get_transactions';
import { eq } from 'drizzle-orm';

describe('getTransactions handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve transactions with numeric conversion', async () => {
    // Insert a category first (required foreign key)
    const categoryInsert = await db
      .insert(categoriesTable)
      .values({ name: 'Food' })
      .returning()
      .execute();
    const categoryId = categoryInsert[0].id;

    // Insert a transaction
    const amount = 123.45;
    const transactionDate = new Date('2023-01-01T12:00:00Z');
    await db
      .insert(transactionsTable)
      .values({
        amount: amount.toString(), // numeric column expects string
        type: 'expense',
        category_id: categoryId,
        description: 'Lunch',
        transaction_date: transactionDate,
      })
      .execute();

    const results = await getTransactions();

    expect(results).toHaveLength(1);
    const tx = results[0];

    // Verify fields
    expect(typeof tx.amount).toBe('number');
    expect(tx.amount).toBeCloseTo(amount);
    expect(tx.type).toBe('expense');
    expect(tx.category_id).toBe(categoryId);
    expect(tx.description).toBe('Lunch');
    expect(tx.transaction_date).toBeInstanceOf(Date);
    expect(tx.created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when no transactions exist', async () => {
    const results = await getTransactions();
    expect(results).toEqual([]);
  });
});
