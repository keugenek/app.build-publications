import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';
import { type CreateProductInput, type Product } from '../schema';

// Mock createProduct function since the real one is a placeholder
const createProduct = async (input: CreateProductInput): Promise<Product> => {
  // Insert product directly into database
  const result = await db.insert(productsTable)
    .values({
      code: input.code,
      name: input.name,
      description: input.description,
      purchase_price: input.purchase_price.toString(),
      selling_price: input.selling_price.toString(),
      stock_quantity: input.stock_quantity
    })
    .returning()
    .execute();

  // Convert numeric fields back to numbers
  const product = result[0];
  return {
    ...product,
    purchase_price: parseFloat(product.purchase_price),
    selling_price: parseFloat(product.selling_price),
    created_at: product.created_at,
    updated_at: product.updated_at
  } as Product;
};

// Test product data
const testProductInput: CreateProductInput = {
  code: 'TEST001',
  name: 'Test Product',
  description: 'A product for testing deletion',
  purchase_price: 10.50,
  selling_price: 19.99,
  stock_quantity: 50
};

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product', async () => {
    // First create a product to delete
    const createdProduct = await createProduct(testProductInput);
    
    // Verify product was created
    expect(createdProduct.id).toBeDefined();
    
    // Delete the product
    const result = await deleteProduct(createdProduct.id);
    
    // Check that deletion was successful
    expect(result).toBe(true);
    
    // Verify product no longer exists in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();
      
    expect(products).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent product', async () => {
    // Try to delete a product that doesn't exist
    const result = await deleteProduct(99999);
    
    // Should return false as no product was deleted
    expect(result).toBe(false);
  });
});
