import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product', async () => {
    // Create a test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: 50
      })
      .returning()
      .execute();

    // Delete the product
    const result = await deleteProduct(product.id);

    expect(result).toBe(true);

    // Verify product was deleted from database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should return false when product does not exist', async () => {
    const nonExistentId = 999;
    
    const result = await deleteProduct(nonExistentId);

    expect(result).toBe(false);
  });

  it('should cascade delete related stock movements', async () => {
    // Create a test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-002',
        stock_level: 100
      })
      .returning()
      .execute();

    // Create related stock movements
    await db.insert(stockMovementsTable)
      .values([
        {
          product_id: product.id,
          movement_type: 'stock-in',
          quantity: 50,
          notes: 'Initial stock'
        },
        {
          product_id: product.id,
          movement_type: 'stock-out',
          quantity: 10,
          notes: 'Sale'
        }
      ])
      .execute();

    // Verify stock movements exist before deletion
    const movementsBeforeDelete = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, product.id))
      .execute();

    expect(movementsBeforeDelete).toHaveLength(2);

    // Delete the product
    const result = await deleteProduct(product.id);

    expect(result).toBe(true);

    // Verify product was deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(0);

    // Verify all related stock movements were also deleted (cascading delete)
    const movementsAfterDelete = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, product.id))
      .execute();

    expect(movementsAfterDelete).toHaveLength(0);
  });

  it('should not affect other products when deleting one product', async () => {
    // Create multiple test products
    const [product1] = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        sku: 'TEST-003',
        stock_level: 30
      })
      .returning()
      .execute();

    const [product2] = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        sku: 'TEST-004',
        stock_level: 40
      })
      .returning()
      .execute();

    // Create stock movements for both products
    await db.insert(stockMovementsTable)
      .values([
        {
          product_id: product1.id,
          movement_type: 'stock-in',
          quantity: 25,
          notes: 'Product 1 stock'
        },
        {
          product_id: product2.id,
          movement_type: 'stock-in',
          quantity: 35,
          notes: 'Product 2 stock'
        }
      ])
      .execute();

    // Delete only product1
    const result = await deleteProduct(product1.id);

    expect(result).toBe(true);

    // Verify product1 and its movements are deleted
    const product1Remaining = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product1.id))
      .execute();

    const product1Movements = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, product1.id))
      .execute();

    expect(product1Remaining).toHaveLength(0);
    expect(product1Movements).toHaveLength(0);

    // Verify product2 and its movements are still intact
    const product2Remaining = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product2.id))
      .execute();

    const product2Movements = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, product2.id))
      .execute();

    expect(product2Remaining).toHaveLength(1);
    expect(product2Remaining[0].name).toBe('Product 2');
    expect(product2Movements).toHaveLength(1);
  });

  it('should handle deletion of product with no stock movements', async () => {
    // Create a product without any stock movements
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Product No Movements',
        sku: 'TEST-005',
        stock_level: 0
      })
      .returning()
      .execute();

    // Delete the product
    const result = await deleteProduct(product.id);

    expect(result).toBe(true);

    // Verify product was deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(0);
  });
});
