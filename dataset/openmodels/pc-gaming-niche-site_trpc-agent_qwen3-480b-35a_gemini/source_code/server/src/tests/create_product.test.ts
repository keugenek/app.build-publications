import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test inputs
const testCategory = {
  name: 'Gaming Mice',
  description: 'Gaming mice for PC'
};

const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99,
  category_id: 1 // Will be updated after creating category
};

describe('createProduct', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    // Update test input with the actual category ID
    (testInput as any).category_id = categoryResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual(testInput.description);
    expect(result.price).toEqual(19.99);
    expect(result.category_id).toEqual(testInput.category_id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual(testInput.description);
    expect(parseFloat(products[0].price!)).toEqual(19.99);
    expect(products[0].category_id).toEqual(testInput.category_id);
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with null price', async () => {
    const inputWithNullPrice: CreateProductInput = {
      ...testInput,
      price: null
    };

    const result = await createProduct(inputWithNullPrice);

    expect(result.price).toBeNull();
    
    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].price).toBeNull();
  });

  it('should fail to create product with non-existent category', async () => {
    const invalidInput: CreateProductInput = {
      ...testInput,
      category_id: 99999 // Non-existent category ID
    };

    await expect(createProduct(invalidInput)).rejects.toThrow(/Category with id 99999 does not exist/);
  });

  it('should handle product with null description', async () => {
    const inputWithNullDesc: CreateProductInput = {
      name: 'Product with null description',
      description: null,
      price: 29.99,
      category_id: testInput.category_id
    };

    const result = await createProduct(inputWithNullDesc);

    expect(result.name).toEqual('Product with null description');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(29.99);
  });
});
