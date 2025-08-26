import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

// Test data
const testProduct1 = {
  name: 'Test Product 1',
  sku: 'TP001',
  stock_level: 10
};

const testProduct2 = {
  name: 'Test Product 2',
  sku: 'TP002',
  stock_level: 20
};

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
    // Insert test products
    await db.insert(productsTable).values([testProduct1, testProduct2]).execute();
  });

  afterEach(resetDB);

  it('should return all products', async () => {
    const products = await getProducts();
    
    expect(products).toHaveLength(2);
    
    const product1 = products.find(p => p.sku === 'TP001');
    const product2 = products.find(p => p.sku === 'TP002');
    
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.stock_level).toEqual(10);
    expect(product1!.id).toBeDefined();
    expect(product1!.created_at).toBeInstanceOf(Date);
    expect(product1!.updated_at).toBeInstanceOf(Date);
    
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.stock_level).toEqual(20);
    expect(product2!.id).toBeDefined();
    expect(product2!.created_at).toBeInstanceOf(Date);
    expect(product2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no products exist', async () => {
    // Clear all products
    await db.delete(productsTable).execute();
    
    const products = await getProducts();
    
    expect(products).toHaveLength(0);
  });

  it('should return products with correct data types', async () => {
    const products = await getProducts();
    
    expect(products).toHaveLength(2);
    
    products.forEach(product => {
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.sku).toBe('string');
      expect(typeof product.stock_level).toBe('number');
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
    });
  });
});
