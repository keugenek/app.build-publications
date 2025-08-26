import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { type CreateStockMovementInput } from '../schema';
import { createStockMovement } from '../handlers/create_stock_movement';
import { eq } from 'drizzle-orm';

describe('createStockMovement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product
  const createTestProduct = async (stockLevel = 50) => {
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: stockLevel
      })
      .returning()
      .execute();
    return result[0];
  };

  describe('stock-in movements', () => {
    it('should create stock-in movement and increase stock level', async () => {
      const product = await createTestProduct(10);
      
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-in',
        quantity: 25,
        notes: 'Restocking inventory'
      };

      const result = await createStockMovement(input);

      // Verify stock movement creation
      expect(result.id).toBeDefined();
      expect(result.product_id).toEqual(product.id);
      expect(result.movement_type).toEqual('stock-in');
      expect(result.quantity).toEqual(25);
      expect(result.notes).toEqual('Restocking inventory');
      expect(result.created_at).toBeInstanceOf(Date);

      // Verify product stock level was updated
      const updatedProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id))
        .execute();

      expect(updatedProduct[0].stock_level).toEqual(35); // 10 + 25
      expect(updatedProduct[0].updated_at).toBeInstanceOf(Date);
    });

    it('should create stock-in movement without notes', async () => {
      const product = await createTestProduct(5);
      
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-in',
        quantity: 15
      };

      const result = await createStockMovement(input);

      expect(result.notes).toBeNull();
      expect(result.quantity).toEqual(15);

      // Verify stock level increased
      const updatedProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id))
        .execute();

      expect(updatedProduct[0].stock_level).toEqual(20); // 5 + 15
    });
  });

  describe('stock-out movements', () => {
    it('should create stock-out movement and decrease stock level', async () => {
      const product = await createTestProduct(50);
      
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-out',
        quantity: 20,
        notes: 'Order fulfillment'
      };

      const result = await createStockMovement(input);

      // Verify stock movement creation
      expect(result.id).toBeDefined();
      expect(result.product_id).toEqual(product.id);
      expect(result.movement_type).toEqual('stock-out');
      expect(result.quantity).toEqual(20);
      expect(result.notes).toEqual('Order fulfillment');
      expect(result.created_at).toBeInstanceOf(Date);

      // Verify product stock level was updated
      const updatedProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id))
        .execute();

      expect(updatedProduct[0].stock_level).toEqual(30); // 50 - 20
    });

    it('should allow stock-out that brings stock to zero', async () => {
      const product = await createTestProduct(10);
      
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-out',
        quantity: 10
      };

      const result = await createStockMovement(input);
      expect(result.quantity).toEqual(10);

      // Verify stock level is now zero
      const updatedProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id))
        .execute();

      expect(updatedProduct[0].stock_level).toEqual(0);
    });

    it('should reject stock-out when insufficient stock', async () => {
      const product = await createTestProduct(5);
      
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-out',
        quantity: 10 // More than available stock
      };

      await expect(createStockMovement(input))
        .rejects.toThrow(/insufficient stock/i);

      // Verify stock level unchanged
      const unchangedProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id))
        .execute();

      expect(unchangedProduct[0].stock_level).toEqual(5); // Should remain unchanged
    });
  });

  describe('validation', () => {
    it('should reject movement for non-existent product', async () => {
      const input: CreateStockMovementInput = {
        product_id: 99999, // Non-existent product ID
        movement_type: 'stock-in',
        quantity: 10
      };

      await expect(createStockMovement(input))
        .rejects.toThrow(/product with id 99999 not found/i);
    });

    it('should save movement to database', async () => {
      const product = await createTestProduct(20);
      
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-in',
        quantity: 15,
        notes: 'Test movement'
      };

      const result = await createStockMovement(input);

      // Verify movement was saved to database
      const movements = await db.select()
        .from(stockMovementsTable)
        .where(eq(stockMovementsTable.id, result.id))
        .execute();

      expect(movements).toHaveLength(1);
      expect(movements[0].product_id).toEqual(product.id);
      expect(movements[0].movement_type).toEqual('stock-in');
      expect(movements[0].quantity).toEqual(15);
      expect(movements[0].notes).toEqual('Test movement');
      expect(movements[0].created_at).toBeInstanceOf(Date);
    });
  });

  describe('transaction integrity', () => {
    it('should rollback all changes if movement creation fails', async () => {
      const product = await createTestProduct(10);
      const originalStockLevel = product.stock_level;

      // Create a scenario that might cause a failure after stock update
      // We'll test with insufficient stock to ensure rollback
      const input: CreateStockMovementInput = {
        product_id: product.id,
        movement_type: 'stock-out',
        quantity: 15 // More than available
      };

      await expect(createStockMovement(input))
        .rejects.toThrow(/insufficient stock/i);

      // Verify product stock level was not modified due to rollback
      const unchangedProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, product.id))
        .execute();

      expect(unchangedProduct[0].stock_level).toEqual(originalStockLevel);

      // Verify no movement record was created
      const movements = await db.select()
        .from(stockMovementsTable)
        .where(eq(stockMovementsTable.product_id, product.id))
        .execute();

      expect(movements).toHaveLength(0);
    });
  });
});
