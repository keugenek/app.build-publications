import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Test input for creating a product
const createInput: CreateProductInput = {
  code: 'TEST001',
  name: 'Test Product',
  description: 'A product for testing',
  purchase_price: 10.99,
  selling_price: 19.99,
  stock_quantity: 100
};

// Function to create a product directly in the database for testing
const createTestProduct = async () => {
  const result = await db.insert(productsTable)
    .values({
      code: createInput.code,
      name: createInput.name,
      description: createInput.description,
      purchase_price: createInput.purchase_price.toString(),
      selling_price: createInput.selling_price.toString(),
      stock_quantity: createInput.stock_quantity
    })
    .returning()
    .execute();
    
  return {
    ...result[0],
    purchase_price: parseFloat(result[0].purchase_price),
    selling_price: parseFloat(result[0].selling_price)
  };
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a product with all fields', async () => {
    // Create a product first
    const product = await createTestProduct();
    
    // Update all fields
    const updateInput: UpdateProductInput = {
      id: product.id,
      code: 'UPDATED001',
      name: 'Updated Product',
      description: 'An updated product',
      purchase_price: 15.99,
      selling_price: 29.99,
      stock_quantity: 50
    };

    const result = await updateProduct(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(product.id);
    expect(result!.code).toEqual('UPDATED001');
    expect(result!.name).toEqual('Updated Product');
    expect(result!.description).toEqual('An updated product');
    expect(result!.purchase_price).toEqual(15.99);
    expect(result!.selling_price).toEqual(29.99);
    expect(result!.stock_quantity).toEqual(50);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(product.updated_at.getTime());
  });

  it('should update a product with partial fields', async () => {
    // Create a product first
    const product = await createTestProduct();
    
    // Update only name and description
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Partially Updated Product',
      description: 'Partially updated description'
    };

    const result = await updateProduct(updateInput);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(product.id);
    expect(result!.code).toEqual(product.code); // Should remain unchanged
    expect(result!.name).toEqual('Partially Updated Product');
    expect(result!.description).toEqual('Partially updated description');
    expect(result!.purchase_price).toEqual(product.purchase_price); // Should remain unchanged
    expect(result!.selling_price).toEqual(product.selling_price); // Should remain unchanged
    expect(result!.stock_quantity).toEqual(product.stock_quantity); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(product.updated_at.getTime());
  });

  it('should return null when updating non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Product'
    };

    const result = await updateProduct(updateInput);
    expect(result).toBeNull();
  });

  it('should save updated product to database', async () => {
    // Create a product first
    const product = await createTestProduct();
    
    // Update the product
    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Database Updated Product',
      selling_price: 39.99
    };

    await updateProduct(updateInput);

    // Query the database to verify changes were saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Product');
    expect(parseFloat(products[0].selling_price)).toEqual(39.99);
    expect(products[0].updated_at).toBeInstanceOf(Date);
    expect(products[0].updated_at.getTime()).toBeGreaterThan(product.updated_at.getTime());
  });
});
