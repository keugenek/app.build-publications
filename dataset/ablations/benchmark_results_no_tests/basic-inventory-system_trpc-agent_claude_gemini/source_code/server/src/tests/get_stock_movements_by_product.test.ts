import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { getStockMovementsByProduct } from '../handlers/get_stock_movements_by_product';
import { eq } from 'drizzle-orm';

// Test data
const testProduct = {
  name: 'Test Widget',
  sku: 'TEST-001',
  stock_level: 50
};

const testProduct2 = {
  name: 'Another Widget',
  sku: 'TEST-002',
  stock_level: 25
};

describe('getStockMovementsByProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return stock movements for a specific product', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    const product = productResult[0];

    // Create stock movements for the product
    await db.insert(stockMovementsTable)
      .values([
        {
          product_id: product.id,
          movement_type: 'stock-in',
          quantity: 10,
          notes: 'Initial stock'
        },
        {
          product_id: product.id,
          movement_type: 'stock-out',
          quantity: 5,
          notes: 'Sale'
        }
      ])
      .execute();

    const result = await getStockMovementsByProduct(product.id);

    expect(result).toHaveLength(2);
    
    // Verify all movements belong to the correct product
    result.forEach(movement => {
      expect(movement.product_id).toEqual(product.id);
      expect(movement.product.id).toEqual(product.id);
      expect(movement.product.name).toEqual('Test Widget');
      expect(movement.product.sku).toEqual('TEST-001');
    });

    // Verify specific movement data
    const stockInMovement = result.find(m => m.movement_type === 'stock-in');
    const stockOutMovement = result.find(m => m.movement_type === 'stock-out');

    expect(stockInMovement).toBeDefined();
    expect(stockInMovement!.quantity).toEqual(10);
    expect(stockInMovement!.notes).toEqual('Initial stock');

    expect(stockOutMovement).toBeDefined();
    expect(stockOutMovement!.quantity).toEqual(5);
    expect(stockOutMovement!.notes).toEqual('Sale');
  });

  it('should return movements ordered by created_at descending (newest first)', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    const product = productResult[0];

    // Create movements with artificial delay to ensure different timestamps
    await db.insert(stockMovementsTable)
      .values({
        product_id: product.id,
        movement_type: 'stock-in',
        quantity: 10,
        notes: 'First movement'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(stockMovementsTable)
      .values({
        product_id: product.id,
        movement_type: 'stock-out',
        quantity: 3,
        notes: 'Second movement'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(stockMovementsTable)
      .values({
        product_id: product.id,
        movement_type: 'stock-in',
        quantity: 5,
        notes: 'Third movement'
      })
      .execute();

    const result = await getStockMovementsByProduct(product.id);

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest should be first
    expect(result[0].notes).toEqual('Third movement');
    expect(result[1].notes).toEqual('Second movement');
    expect(result[2].notes).toEqual('First movement');

    // Verify timestamps are in descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].created_at >= result[i].created_at).toBe(true);
    }
  });

  it('should return empty array for product with no stock movements', async () => {
    // Create test product but no movements
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    const product = productResult[0];

    const result = await getStockMovementsByProduct(product.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return movements for the specified product', async () => {
    // Create two products
    const product1Result = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    const product1 = product1Result[0];

    const product2Result = await db.insert(productsTable)
      .values(testProduct2)
      .returning()
      .execute();
    const product2 = product2Result[0];

    // Create movements for both products
    await db.insert(stockMovementsTable)
      .values([
        {
          product_id: product1.id,
          movement_type: 'stock-in',
          quantity: 10,
          notes: 'Product 1 movement'
        },
        {
          product_id: product2.id,
          movement_type: 'stock-in',
          quantity: 15,
          notes: 'Product 2 movement'
        },
        {
          product_id: product1.id,
          movement_type: 'stock-out',
          quantity: 3,
          notes: 'Another Product 1 movement'
        }
      ])
      .execute();

    // Query movements for product1 only
    const result = await getStockMovementsByProduct(product1.id);

    expect(result).toHaveLength(2);
    
    // Verify all movements belong to product1
    result.forEach(movement => {
      expect(movement.product_id).toEqual(product1.id);
      expect(movement.product.name).toEqual('Test Widget');
      expect(movement.notes).toMatch(/Product 1/);
    });
  });

  it('should handle movements with null notes', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    const product = productResult[0];

    // Create movement without notes
    await db.insert(stockMovementsTable)
      .values({
        product_id: product.id,
        movement_type: 'stock-in',
        quantity: 20,
        notes: null
      })
      .execute();

    const result = await getStockMovementsByProduct(product.id);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].quantity).toEqual(20);
    expect(result[0].movement_type).toEqual('stock-in');
  });

  it('should include complete product information', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    const product = productResult[0];

    // Create a stock movement
    await db.insert(stockMovementsTable)
      .values({
        product_id: product.id,
        movement_type: 'stock-out',
        quantity: 7,
        notes: 'Test movement'
      })
      .execute();

    const result = await getStockMovementsByProduct(product.id);

    expect(result).toHaveLength(1);
    
    const movement = result[0];
    
    // Verify complete product information is included
    expect(movement.product).toBeDefined();
    expect(movement.product.id).toEqual(product.id);
    expect(movement.product.name).toEqual('Test Widget');
    expect(movement.product.sku).toEqual('TEST-001');
    expect(movement.product.stock_level).toEqual(50);
    expect(movement.product.created_at).toBeInstanceOf(Date);
    expect(movement.product.updated_at).toBeInstanceOf(Date);

    // Verify movement data structure
    expect(movement.id).toBeDefined();
    expect(movement.product_id).toEqual(product.id);
    expect(movement.movement_type).toEqual('stock-out');
    expect(movement.quantity).toEqual(7);
    expect(movement.notes).toEqual('Test movement');
    expect(movement.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent product', async () => {
    // Query for a product that doesn't exist
    const result = await getStockMovementsByProduct(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
