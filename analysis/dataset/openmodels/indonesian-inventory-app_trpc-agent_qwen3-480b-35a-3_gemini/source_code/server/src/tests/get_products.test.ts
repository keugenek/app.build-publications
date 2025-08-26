import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

// Test products
const testProduct1: CreateProductInput = {
  code: 'P001',
  name: 'Test Product 1',
  description: 'First test product',
  purchase_price: 10.50,
  selling_price: 15.99,
  stock_quantity: 50
};

const testProduct2: CreateProductInput = {
  code: 'P002',
  name: 'Test Product 2',
  description: 'Second test product',
  purchase_price: 20.00,
  selling_price: 29.99,
  stock_quantity: 100
};

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test products
    await db.insert(productsTable).values({
      ...testProduct1,
      purchase_price: testProduct1.purchase_price.toString(),
      selling_price: testProduct1.selling_price.toString()
    }).execute();
    
    await db.insert(productsTable).values({
      ...testProduct2,
      purchase_price: testProduct2.purchase_price.toString(),
      selling_price: testProduct2.selling_price.toString()
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all products from the database', async () => {
    const products = await getProducts();

    expect(products).toHaveLength(2);
    
    // Check first product
    const product1 = products.find(p => p.code === 'P001');
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.description).toEqual('First test product');
    expect(product1!.purchase_price).toEqual(10.50);
    expect(product1!.selling_price).toEqual(15.99);
    expect(product1!.stock_quantity).toEqual(50);
    expect(product1!.id).toBeDefined();
    expect(product1!.created_at).toBeInstanceOf(Date);
    expect(product1!.updated_at).toBeInstanceOf(Date);
    
    // Check second product
    const product2 = products.find(p => p.code === 'P002');
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.description).toEqual('Second test product');
    expect(product2!.purchase_price).toEqual(20.00);
    expect(product2!.selling_price).toEqual(29.99);
    expect(product2!.stock_quantity).toEqual(100);
    expect(product2!.id).toBeDefined();
    expect(product2!.created_at).toBeInstanceOf(Date);
    expect(product2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no products exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const products = await getProducts();
    expect(products).toHaveLength(0);
    expect(products).toEqual([]);
  });

  it('should properly convert numeric fields', async () => {
    const products = await getProducts();
    
    products.forEach(product => {
      // Check that numeric fields are properly converted to numbers
      expect(typeof product.purchase_price).toBe('number');
      expect(typeof product.selling_price).toBe('number');
      expect(typeof product.stock_quantity).toBe('number');
      
      // Check that the values are finite numbers
      expect(Number.isFinite(product.purchase_price)).toBe(true);
      expect(Number.isFinite(product.selling_price)).toBe(true);
      expect(Number.isInteger(product.stock_quantity)).toBe(true);
    });
  });
});
