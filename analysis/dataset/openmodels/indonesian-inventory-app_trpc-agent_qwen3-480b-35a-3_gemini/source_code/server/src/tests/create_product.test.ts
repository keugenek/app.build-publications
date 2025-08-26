import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateProductInput = {
  code: 'TEST001',
  name: 'Test Product',
  description: 'A product for testing',
  purchase_price: 10.99,
  selling_price: 19.99,
  stock_quantity: 100
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.code).toEqual('TEST001');
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual(testInput.description);
    expect(result.purchase_price).toEqual(10.99);
    expect(result.selling_price).toEqual(19.99);
    expect(result.stock_quantity).toEqual(100);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Check that numeric fields are properly converted
    expect(typeof result.purchase_price).toBe('number');
    expect(typeof result.selling_price).toBe('number');
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].code).toEqual('TEST001');
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual(testInput.description);
    expect(parseFloat(products[0].purchase_price)).toEqual(10.99);
    expect(parseFloat(products[0].selling_price)).toEqual(19.99);
    expect(products[0].stock_quantity).toEqual(100);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle product with null description', async () => {
    const input: CreateProductInput = {
      code: 'TEST002',
      name: 'Test Product 2',
      description: null,
      purchase_price: 5.50,
      selling_price: 10.00,
      stock_quantity: 50
    };

    const result = await createProduct(input);
    
    expect(result.description).toBeNull();
    expect(result.code).toEqual('TEST002');
    expect(result.name).toEqual('Test Product 2');
    expect(result.purchase_price).toEqual(5.50);
    expect(result.selling_price).toEqual(10.00);
    expect(result.stock_quantity).toEqual(50);
  });
});
