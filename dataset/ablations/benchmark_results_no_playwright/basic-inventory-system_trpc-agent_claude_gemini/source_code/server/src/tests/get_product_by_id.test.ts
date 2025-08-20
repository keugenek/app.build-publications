import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductByIdInput } from '../schema';
import { getProductById } from '../handlers/get_product_by_id';
import { eq } from 'drizzle-orm';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a product by ID', async () => {
    // First create a test product
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product description',
        stock_level: 50
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];
    const input: GetProductByIdInput = { id: createdProduct.id };

    // Get the product by ID
    const result = await getProductById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProduct.id);
    expect(result!.name).toEqual('Test Product');
    expect(result!.sku).toEqual('TEST-001');
    expect(result!.description).toEqual('A test product description');
    expect(result!.stock_level).toEqual(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product does not exist', async () => {
    const input: GetProductByIdInput = { id: 99999 };

    const result = await getProductById(input);

    expect(result).toBeNull();
  });

  it('should handle product with null description', async () => {
    // Create a product with null description
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Product No Description',
        sku: 'NO-DESC-001',
        description: null,
        stock_level: 25
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];
    const input: GetProductByIdInput = { id: createdProduct.id };

    const result = await getProductById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProduct.id);
    expect(result!.name).toEqual('Product No Description');
    expect(result!.sku).toEqual('NO-DESC-001');
    expect(result!.description).toBeNull();
    expect(result!.stock_level).toEqual(25);
  });

  it('should handle product with zero stock level', async () => {
    // Create a product with zero stock
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Out of Stock Product',
        sku: 'OOS-001',
        description: 'This product is out of stock',
        stock_level: 0
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];
    const input: GetProductByIdInput = { id: createdProduct.id };

    const result = await getProductById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProduct.id);
    expect(result!.name).toEqual('Out of Stock Product');
    expect(result!.stock_level).toEqual(0);
  });

  it('should verify product exists in database after retrieval', async () => {
    // Create a test product
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Verify Product',
        sku: 'VERIFY-001',
        description: 'Product to verify database consistency',
        stock_level: 100
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];
    const input: GetProductByIdInput = { id: createdProduct.id };

    // Get the product using the handler
    const result = await getProductById(input);

    // Verify the product exists in the database directly
    const dbProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();

    expect(dbProducts).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dbProducts[0].id);
    expect(result!.name).toEqual(dbProducts[0].name);
    expect(result!.sku).toEqual(dbProducts[0].sku);
    expect(result!.stock_level).toEqual(dbProducts[0].stock_level);
  });
});
