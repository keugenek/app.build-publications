import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { type CreateProductInput, type CreateStockMovementInput } from '../schema';
import { getStockMovements } from '../handlers/get_stock_movements';

describe('getStockMovements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no stock movements exist', async () => {
    const result = await getStockMovements();
    expect(result).toEqual([]);
  });

  it('should return stock movements with product details', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create a stock movement
    await db.insert(stockMovementsTable)
      .values({
        product_id: productId,
        movement_type: 'stock-in',
        quantity: 50,
        notes: 'Initial stock'
      })
      .execute();

    const result = await getStockMovements();

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(productId);
    expect(result[0].movement_type).toEqual('stock-in');
    expect(result[0].quantity).toEqual(50);
    expect(result[0].notes).toEqual('Initial stock');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify product details are included
    expect(result[0].product).toBeDefined();
    expect(result[0].product.id).toEqual(productId);
    expect(result[0].product.name).toEqual('Test Product');
    expect(result[0].product.sku).toEqual('TEST-001');
    expect(result[0].product.stock_level).toEqual(100);
    expect(result[0].product.created_at).toBeInstanceOf(Date);
    expect(result[0].product.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple stock movements ordered by created_at descending', async () => {
    // Create two test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'PROD-001',
        stock_level: 50
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'PROD-002',
        stock_level: 25
      })
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create multiple stock movements with slight delay to ensure different timestamps
    await db.insert(stockMovementsTable)
      .values({
        product_id: product1Id,
        movement_type: 'stock-in',
        quantity: 30,
        notes: 'First movement'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(stockMovementsTable)
      .values({
        product_id: product2Id,
        movement_type: 'stock-out',
        quantity: 15,
        notes: 'Second movement'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(stockMovementsTable)
      .values({
        product_id: product1Id,
        movement_type: 'stock-out',
        quantity: 10,
        notes: null // Test null notes
      })
      .execute();

    const result = await getStockMovements();

    expect(result).toHaveLength(3);

    // Verify ordering - newest first
    expect(result[0].notes).toBeNull(); // Most recent (third movement)
    expect(result[1].notes).toEqual('Second movement');
    expect(result[2].notes).toEqual('First movement'); // Oldest

    // Verify all movements have correct structure
    result.forEach(movement => {
      expect(movement.id).toBeDefined();
      expect(movement.product_id).toBeDefined();
      expect(movement.movement_type).toMatch(/^(stock-in|stock-out)$/);
      expect(movement.quantity).toBeTypeOf('number');
      expect(movement.created_at).toBeInstanceOf(Date);
      expect(movement.product).toBeDefined();
      expect(movement.product.id).toBeDefined();
      expect(movement.product.name).toBeTypeOf('string');
      expect(movement.product.sku).toBeTypeOf('string');
      expect(movement.product.stock_level).toBeTypeOf('number');
    });

    // Verify product details are correct for each movement
    const product1Movements = result.filter(m => m.product_id === product1Id);
    const product2Movements = result.filter(m => m.product_id === product2Id);

    expect(product1Movements).toHaveLength(2);
    expect(product2Movements).toHaveLength(1);

    product1Movements.forEach(movement => {
      expect(movement.product.name).toEqual('Product 1');
      expect(movement.product.sku).toEqual('PROD-001');
    });

    product2Movements.forEach(movement => {
      expect(movement.product.name).toEqual('Product 2');
      expect(movement.product.sku).toEqual('PROD-002');
    });
  });

  it('should handle different movement types correctly', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Movement Test Product',
        sku: 'MOVE-001',
        stock_level: 100
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create movements of different types
    await db.insert(stockMovementsTable)
      .values({
        product_id: productId,
        movement_type: 'stock-in',
        quantity: 25,
        notes: 'Stock incoming'
      })
      .execute();

    await db.insert(stockMovementsTable)
      .values({
        product_id: productId,
        movement_type: 'stock-out',
        quantity: 10,
        notes: 'Stock outgoing'
      })
      .execute();

    const result = await getStockMovements();

    expect(result).toHaveLength(2);

    const stockInMovement = result.find(m => m.movement_type === 'stock-in');
    const stockOutMovement = result.find(m => m.movement_type === 'stock-out');

    expect(stockInMovement).toBeDefined();
    expect(stockInMovement!.quantity).toEqual(25);
    expect(stockInMovement!.notes).toEqual('Stock incoming');

    expect(stockOutMovement).toBeDefined();
    expect(stockOutMovement!.quantity).toEqual(10);
    expect(stockOutMovement!.notes).toEqual('Stock outgoing');
  });
});
