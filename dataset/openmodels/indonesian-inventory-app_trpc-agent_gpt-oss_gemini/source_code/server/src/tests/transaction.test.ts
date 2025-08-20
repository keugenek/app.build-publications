import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { itemsTable, transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createTransaction, getTransactions } from '../handlers/transaction';
import { type CreateTransactionInput } from '../schema';

// Helper to create an item directly in DB
const createTestItem = async () => {
  const [item] = await db
    .insert(itemsTable)
    .values({
      name: 'Test Item',
      code: 'TI001',
      description: 'A test item',
      purchase_price: '10.00', // numeric stored as string
      sale_price: '15.00',
      unit: 'Pcs',
      stock: 0
    })
    .returning()
    .execute();
  return item;
};

describe('Transaction handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction and update item stock (masuk)', async () => {
    const item = await createTestItem();
    const input: CreateTransactionInput = {
      item_id: item.id,
      date: new Date(),
      quantity: 5,
      note: 'Stock in',
      type: 'masuk'
    };

    const transaction = await createTransaction(input);

    // Verify transaction fields
    expect(transaction.item_id).toBe(item.id);
    expect(transaction.quantity).toBe(5);
    expect(transaction.note).toBe('Stock in');
    expect(transaction.type).toBe('masuk');
    expect(transaction.id).toBeDefined();
    expect(transaction.created_at).toBeInstanceOf(Date);

    // Verify stock updated
    const updatedItem = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    expect(updatedItem[0].stock).toBe(5);
  });

  it('should create a transaction and update item stock (keluar)', async () => {
    // Start with stock 10
    const [item] = await db
      .insert(itemsTable)
      .values({
        name: 'Test Item2',
        code: 'TI002',
        description: null,
        purchase_price: '20.00',
        sale_price: '30.00',
        unit: 'Kotak',
        stock: 10
      })
      .returning()
      .execute();

    const input: CreateTransactionInput = {
      item_id: item.id,
      date: new Date(),
      quantity: 4,
      note: null,
      type: 'keluar'
    };

    const transaction = await createTransaction(input);
    expect(transaction.type).toBe('keluar');

    const updated = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, item.id))
      .execute();
    expect(updated[0].stock).toBe(6);
  });

  it('should fetch all transactions', async () => {
    const item = await createTestItem();
    // create two transactions
    await createTransaction({
      item_id: item.id,
      date: new Date(),
      quantity: 2,
      note: null,
      type: 'masuk'
    });
    await createTransaction({
      item_id: item.id,
      date: new Date(),
      quantity: 1,
      note: null,
      type: 'keluar'
    });

    const transactions = await getTransactions();
    expect(transactions.length).toBeGreaterThanOrEqual(2);
    // Ensure each transaction has required fields
    transactions.forEach(t => {
      expect(t.id).toBeDefined();
      expect(t.item_id).toBe(item.id);
      expect(t.quantity).toBeDefined();
      expect(t.type).toBeDefined();
      expect(t.created_at).toBeInstanceOf(Date);
    });
  });
});
