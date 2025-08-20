import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { getProductsWithStockSummary } from '../handlers/get_products_with_stock_summary';

describe('getProductsWithStockSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProductsWithStockSummary();
    expect(result).toEqual([]);
  });

  it('should return products with zero transaction totals when no transactions exist', async () => {
    // Create test products without transactions
    await db.insert(productsTable).values([
      { name: 'Product A', sku: 'SKU-A', stock_level: 10 },
      { name: 'Product B', sku: 'SKU-B', stock_level: 5 }
    ]).execute();

    const result = await getProductsWithStockSummary();

    expect(result).toHaveLength(2);
    
    const productA = result.find(p => p.sku === 'SKU-A');
    expect(productA).toBeDefined();
    expect(productA!.name).toBe('Product A');
    expect(productA!.stock_level).toBe(10);
    expect(productA!.total_stock_in).toBe(0);
    expect(productA!.total_stock_out).toBe(0);
    expect(productA!.created_at).toBeInstanceOf(Date);
    expect(productA!.updated_at).toBeInstanceOf(Date);

    const productB = result.find(p => p.sku === 'SKU-B');
    expect(productB).toBeDefined();
    expect(productB!.name).toBe('Product B');
    expect(productB!.stock_level).toBe(5);
    expect(productB!.total_stock_in).toBe(0);
    expect(productB!.total_stock_out).toBe(0);
  });

  it('should calculate correct stock totals with mixed transactions', async () => {
    // Create test products
    const products = await db.insert(productsTable).values([
      { name: 'Widget', sku: 'WIDGET-001', stock_level: 25 },
      { name: 'Gadget', sku: 'GADGET-001', stock_level: 15 }
    ]).returning().execute();

    const widgetId = products[0].id;
    const gadgetId = products[1].id;

    // Create transactions for widget
    await db.insert(transactionsTable).values([
      { product_id: widgetId, type: 'stock_in', quantity: 50, notes: 'Initial stock' },
      { product_id: widgetId, type: 'stock_in', quantity: 30, notes: 'Restocking' },
      { product_id: widgetId, type: 'stock_out', quantity: 20, notes: 'Sale' },
      { product_id: widgetId, type: 'stock_out', quantity: 35, notes: 'Bulk order' }
    ]).execute();

    // Create transactions for gadget
    await db.insert(transactionsTable).values([
      { product_id: gadgetId, type: 'stock_in', quantity: 40, notes: 'New inventory' },
      { product_id: gadgetId, type: 'stock_out', quantity: 25, notes: 'Customer order' }
    ]).execute();

    const result = await getProductsWithStockSummary();

    expect(result).toHaveLength(2);

    const widget = result.find(p => p.sku === 'WIDGET-001');
    expect(widget).toBeDefined();
    expect(widget!.name).toBe('Widget');
    expect(widget!.stock_level).toBe(25);
    expect(widget!.total_stock_in).toBe(80); // 50 + 30
    expect(widget!.total_stock_out).toBe(55); // 20 + 35

    const gadget = result.find(p => p.sku === 'GADGET-001');
    expect(gadget).toBeDefined();
    expect(gadget!.name).toBe('Gadget');
    expect(gadget!.stock_level).toBe(15);
    expect(gadget!.total_stock_in).toBe(40);
    expect(gadget!.total_stock_out).toBe(25);
  });

  it('should handle products with only stock_in transactions', async () => {
    // Create product
    const products = await db.insert(productsTable).values({
      name: 'New Product',
      sku: 'NEW-001',
      stock_level: 100
    }).returning().execute();

    const productId = products[0].id;

    // Add only stock_in transactions
    await db.insert(transactionsTable).values([
      { product_id: productId, type: 'stock_in', quantity: 60, notes: 'First delivery' },
      { product_id: productId, type: 'stock_in', quantity: 40, notes: 'Second delivery' }
    ]).execute();

    const result = await getProductsWithStockSummary();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('New Product');
    expect(result[0].total_stock_in).toBe(100); // 60 + 40
    expect(result[0].total_stock_out).toBe(0);
  });

  it('should handle products with only stock_out transactions', async () => {
    // Create product
    const products = await db.insert(productsTable).values({
      name: 'Clearance Item',
      sku: 'CLEAR-001',
      stock_level: 0
    }).returning().execute();

    const productId = products[0].id;

    // Add only stock_out transactions
    await db.insert(transactionsTable).values([
      { product_id: productId, type: 'stock_out', quantity: 30, notes: 'Sale 1' },
      { product_id: productId, type: 'stock_out', quantity: 20, notes: 'Sale 2' }
    ]).execute();

    const result = await getProductsWithStockSummary();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Clearance Item');
    expect(result[0].total_stock_in).toBe(0);
    expect(result[0].total_stock_out).toBe(50); // 30 + 20
  });

  it('should return all product fields correctly', async () => {
    // Create product with specific data
    const products = await db.insert(productsTable).values({
      name: 'Test Product',
      sku: 'TEST-SKU-123',
      stock_level: 42
    }).returning().execute();

    const result = await getProductsWithStockSummary();

    expect(result).toHaveLength(1);
    const product = result[0];
    
    // Verify all required fields are present and correct types
    expect(typeof product.id).toBe('number');
    expect(product.id).toBe(products[0].id);
    expect(product.name).toBe('Test Product');
    expect(product.sku).toBe('TEST-SKU-123');
    expect(product.stock_level).toBe(42);
    expect(typeof product.total_stock_in).toBe('number');
    expect(typeof product.total_stock_out).toBe('number');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });

  it('should handle large transaction quantities correctly', async () => {
    // Create product
    const products = await db.insert(productsTable).values({
      name: 'High Volume Product',
      sku: 'HIGH-VOL',
      stock_level: 1000
    }).returning().execute();

    const productId = products[0].id;

    // Add transactions with large quantities
    await db.insert(transactionsTable).values([
      { product_id: productId, type: 'stock_in', quantity: 9999, notes: 'Bulk import' },
      { product_id: productId, type: 'stock_in', quantity: 5000, notes: 'Another bulk' },
      { product_id: productId, type: 'stock_out', quantity: 7500, notes: 'Major sale' },
      { product_id: productId, type: 'stock_out', quantity: 2500, notes: 'Another sale' }
    ]).execute();

    const result = await getProductsWithStockSummary();

    expect(result).toHaveLength(1);
    expect(result[0].total_stock_in).toBe(14999); // 9999 + 5000
    expect(result[0].total_stock_out).toBe(10000); // 7500 + 2500
  });
});
