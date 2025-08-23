import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test category data
const testCategory = {
  name: 'Test Category',
  slug: 'test-category',
  description: 'A category for testing'
};

// Test product input
const testInput: CreateProductInput = {
  name: 'Test Product',
  slug: 'test-product',
  description: 'A product for testing',
  price: 19.99,
  category_id: 1,
  image_url: 'https://example.com/image.jpg'
};

describe('createProduct', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    // Update testInput with the actual category ID
    (testInput as any).category_id = categoryResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.slug).toEqual('test-product');
    expect(result.description).toEqual(testInput.description);
    expect(result.price).toEqual(19.99);
    expect(result.category_id).toEqual(testInput.category_id);
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
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
    expect(products[0].slug).toEqual('test-product');
    expect(products[0].description).toEqual(testInput.description);
    expect(parseFloat(products[0].price)).toEqual(19.99);
    expect(products[0].category_id).toEqual(testInput.category_id);
    expect(products[0].image_url).toEqual('https://example.com/image.jpg');
    expect(products[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when category does not exist', async () => {
    const invalidInput: CreateProductInput = {
      ...testInput,
      category_id: 999 // Non-existent category ID
    };

    await expect(createProduct(invalidInput)).rejects.toThrow(/Category with id 999 does not exist/);
  });

  it('should handle product with null description and image_url', async () => {
    const inputWithNulls: CreateProductInput = {
      name: 'Test Product Null',
      slug: 'test-product-null',
      description: null,
      price: 29.99,
      category_id: testInput.category_id,
      image_url: null
    };

    const result = await createProduct(inputWithNulls);

    expect(result.name).toEqual('Test Product Null');
    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.price).toEqual(29.99);
  });

  it('should convert numeric price correctly', async () => {
    const inputWithPrice: CreateProductInput = {
      ...testInput,
      name: 'Price Test Product',
      slug: 'price-test-product',
      price: 99.99
    };

    const result = await createProduct(inputWithPrice);

    // Verify the price is returned as a number
    expect(typeof result.price).toBe('number');
    expect(result.price).toEqual(99.99);

    // Verify it's stored correctly in the database as a string
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(typeof products[0].price).toBe('string');
    expect(parseFloat(products[0].price)).toEqual(99.99);
  });
});
