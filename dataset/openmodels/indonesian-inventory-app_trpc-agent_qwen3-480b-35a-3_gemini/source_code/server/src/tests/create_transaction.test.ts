import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, productsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test product data
const testProduct = {
  code: 'TEST001',
  name: 'Test Product',
  description: 'A product for testing',
  purchase_price: 10.00,
  selling_price: 19.99,
  stock_quantity: 100
};

// Test transaction input
const testInput: CreateTransactionInput = {
  product_id: 1,
  type: 'IN',
  quantity: 10,
  reference: 'PO-12345',
  notes: 'Received from supplier'
};

describe('createTransaction', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test product first since transaction references a product
    const product = await db.insert(productsTable)
      .values({
        ...testProduct,
        purchase_price: testProduct.purchase_price.toString(),
        selling_price: testProduct.selling_price.toString()
      })
      .returning()
      .execute();
    
    // Update test input with the actual product id
    (testInput as any).product_id = product[0].id;
  });
  
  afterEach(resetDB);

  it('should create a transaction', async () => {
    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.product_id).toEqual(testInput.product_id);
    expect(result.type).toEqual(testInput.type);
    expect(result.quantity).toEqual(testInput.quantity);
    expect(result.reference).toEqual(testInput.reference);
    expect(result.notes).toEqual(testInput.notes);
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
    expect(transactions[0].product_id).toEqual(testInput.product_id);
    expect(transactions[0].type).toEqual(testInput.type);
    expect(transactions[0].quantity).toEqual(testInput.quantity);
    expect(transactions[0].reference).toEqual(testInput.reference);
    expect(transactions[0].notes).toEqual(testInput.notes);
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const invalidInput: CreateTransactionInput = {
      product_id: 99999, // Non-existent product ID
      type: 'OUT',
      quantity: 5,
      reference: null,
      notes: null
    };

    await expect(createTransaction(invalidInput)).rejects.toThrow(/Product with id 99999 not found/);
  });

  it('should handle transaction without optional fields', async () => {
    const minimalInput: CreateTransactionInput = {
      product_id: testInput.product_id,
      type: 'OUT',
      quantity: 3,
      reference: null,
      notes: null
    };

    const result = await createTransaction(minimalInput);

    expect(result.product_id).toEqual(minimalInput.product_id);
    expect(result.type).toEqual(minimalInput.type);
    expect(result.quantity).toEqual(minimalInput.quantity);
    expect(result.reference).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
