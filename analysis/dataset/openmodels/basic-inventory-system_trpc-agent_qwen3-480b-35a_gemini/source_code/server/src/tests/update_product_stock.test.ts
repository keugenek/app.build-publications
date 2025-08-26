import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { updateProductStock } from '../handlers/update_product_stock';
import { eq } from 'drizzle-orm';

// Test product input
const testProduct: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_quantity: 50
};

describe('updateProductStock', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product
    await db.insert(productsTable).values(testProduct).execute();
  });
  
  afterEach(resetDB);

  it('should update product stock quantity', async () => {
    const productId = 1; // ID of the created product
    const newQuantity = 100;
    
    const result = await updateProductStock(productId, newQuantity);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(productId);
    expect(result!.stock_quantity).toBe(newQuantity);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify in database
    const productInDB = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();
    
    expect(productInDB[0].stock_quantity).toBe(newQuantity);
    expect(productInDB[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product does not exist', async () => {
    const nonExistentId = 999;
    const newQuantity = 100;
    
    const result = await updateProductStock(nonExistentId, newQuantity);
    
    expect(result).toBeNull();
  });

  it('should update product stock to zero', async () => {
    const productId = 1;
    const newQuantity = 0;
    
    const result = await updateProductStock(productId, newQuantity);
    
    expect(result).not.toBeNull();
    expect(result!.stock_quantity).toBe(newQuantity);
  });
});
