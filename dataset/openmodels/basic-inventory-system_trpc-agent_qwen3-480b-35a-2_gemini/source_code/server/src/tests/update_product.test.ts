import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(resetDB);

  it('should update a product with all fields', async () => {
    // First create a product to update directly in the database
    const createdResult = await db.insert(productsTable)
      .values({
        name: 'Initial Product',
        sku: 'INIT-001',
        stock_level: 50
      })
      .returning()
      .execute();
    
    const createdProduct = createdResult[0];
    
    // Update all fields
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Updated Product Name',
      sku: 'UPD-001',
      stock_level: 75
    };
    
    const result = await updateProduct(updateInput);

    // Validate returned product data
    expect(result.id).toEqual(createdProduct.id);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.sku).toEqual('UPD-001');
    expect(result.stock_level).toEqual(75);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(createdProduct.updated_at.getTime());
  });

  it('should partially update a product', async () => {
    // First create a product to update
    const createdResult = await db.insert(productsTable)
      .values({
        name: 'Initial Product',
        sku: 'INIT-001',
        stock_level: 50
      })
      .returning()
      .execute();
    
    const createdProduct = createdResult[0];
    
    // Update only the name
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Partially Updated Product'
    };
    
    const result = await updateProduct(updateInput);

    // Validate that only the name changed
    expect(result.name).toEqual('Partially Updated Product');
    expect(result.sku).toEqual('INIT-001'); // Should remain the same
    expect(result.stock_level).toEqual(50); // Should remain the same
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(createdProduct.updated_at.getTime());
  });

  it('should save updated product to database', async () => {
    // First create a product to update
    const createdResult = await db.insert(productsTable)
      .values({
        name: 'Initial Product',
        sku: 'INIT-001',
        stock_level: 50
      })
      .returning()
      .execute();
    
    const createdProduct = createdResult[0];
    
    // Update the product
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Database Updated Product',
      stock_level: 100
    };
    
    await updateProduct(updateInput);

    // Query the database to verify changes
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();

    expect(products).toHaveLength(1);
    const product = products[0];
    expect(product.name).toEqual('Database Updated Product');
    expect(product.sku).toEqual('INIT-001'); // Should remain unchanged
    expect(product.stock_level).toEqual(100);
    expect(product.updated_at.getTime()).toBeGreaterThanOrEqual(createdProduct.updated_at.getTime());
  });

  it('should throw an error when updating a non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Product'
    };
    
    await expect(updateProduct(updateInput))
      .rejects
      .toThrow(/Product with id 99999 not found/);
  });
});
