import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test products directly
    await db.insert(productsTable).values({
      name: 'Test Product 1',
      stock_quantity: 100
    }).execute();
    
    await db.insert(productsTable).values({
      name: 'Test Product 2',
      stock_quantity: 50
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all products from the database', async () => {
    const results = await getProducts();

    // Should return all products
    expect(results).toHaveLength(2);
    
    // Validate first product
    const product1 = results.find(p => p.name === 'Test Product 1');
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.stock_quantity).toEqual(100);
    expect(product1!.id).toBeDefined();
    expect(product1!.created_at).toBeInstanceOf(Date);
    expect(product1!.updated_at).toBeInstanceOf(Date);
    
    // Validate second product
    const product2 = results.find(p => p.name === 'Test Product 2');
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.stock_quantity).toEqual(50);
    expect(product2!.id).toBeDefined();
    expect(product2!.created_at).toBeInstanceOf(Date);
    expect(product2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no products exist', async () => {
    // Clear all products
    await db.delete(productsTable).execute();
    
    const results = await getProducts();
    expect(results).toHaveLength(0);
  });

  it('should return products with correct data types', async () => {
    const results = await getProducts();

    expect(results).toHaveLength(2);
    
    results.forEach(product => {
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.stock_quantity).toBe('number');
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
    });
  });
});