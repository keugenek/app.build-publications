import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, productsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { getTransaction } from '../handlers/get_transaction';
import { eq } from 'drizzle-orm';

// Test product data
const testProduct = {
  code: 'TEST001',
  name: 'Test Product',
  description: 'A product for testing',
  purchase_price: '10.00', // String for numeric column
  selling_price: '19.99', // String for numeric column
  stock_quantity: 100
};

// Test transaction data
const testTransaction = {
  product_id: 0, // Will be set after product creation
  type: 'IN' as const,
  quantity: 10,
  reference: 'TEST-REF-001',
  notes: 'Test transaction notes'
};

describe('getTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a product first as transactions reference products
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    
    testTransaction.product_id = productResult[0].id;
  });
  
  afterEach(resetDB);

  it('should fetch an existing transaction by ID', async () => {
    // Create a transaction first
    const createdResult = await db.insert(transactionsTable)
      .values(testTransaction)
      .returning()
      .execute();
    
    const createdTransaction = createdResult[0];
    
    // Fetch the transaction by ID
    const result = await getTransaction(createdTransaction.id);
    
    // Validate the fetched transaction
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTransaction.id);
    expect(result!.product_id).toEqual(testTransaction.product_id);
    expect(result!.type).toEqual(testTransaction.type);
    expect(result!.quantity).toEqual(testTransaction.quantity);
    expect(result!.reference).toEqual(testTransaction.reference);
    expect(result!.notes).toEqual(testTransaction.notes);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent transaction ID', async () => {
    const result = await getTransaction(99999);
    expect(result).toBeNull();
  });

  it('should fetch transaction from database correctly', async () => {
    // Create a transaction
    const createdResult = await db.insert(transactionsTable)
      .values(testTransaction)
      .returning()
      .execute();
    
    const createdTransaction = createdResult[0];
    
    // Query directly from database to verify it was saved
    const dbTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, createdTransaction.id))
      .execute();
    
    expect(dbTransactions).toHaveLength(1);
    expect(dbTransactions[0].id).toEqual(createdTransaction.id);
    
    // Fetch using our handler
    const fetchedTransaction = await getTransaction(createdTransaction.id);
    
    // Verify both results match
    expect(fetchedTransaction).not.toBeNull();
    expect(fetchedTransaction!.id).toEqual(dbTransactions[0].id);
    expect(fetchedTransaction!.product_id).toEqual(dbTransactions[0].product_id);
    expect(fetchedTransaction!.type).toEqual(dbTransactions[0].type);
    expect(fetchedTransaction!.quantity).toEqual(dbTransactions[0].quantity);
    expect(fetchedTransaction!.reference).toEqual(dbTransactions[0].reference);
    expect(fetchedTransaction!.notes).toEqual(dbTransactions[0].notes);
  });
});
