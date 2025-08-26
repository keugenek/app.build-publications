import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type CreateCategoryInput } from '../schema';
import { getProducts, getProductsByCategory } from '../handlers/get_products';
import { eq } from 'drizzle-orm';

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test category first (required for foreign key constraint)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create test products
    await db.insert(productsTable)
      .values({
        name: 'Test Product 1',
        slug: 'test-product-1',
        description: 'First test product',
        price: '19.99',
        category_id: categoryId,
        image_url: 'https://example.com/product1.jpg'
      })
      .execute();
      
    await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        slug: 'test-product-2',
        description: 'Second test product',
        price: '29.99',
        category_id: categoryId,
        image_url: 'https://example.com/product2.jpg'
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all products', async () => {
    const products = await getProducts();

    expect(products).toHaveLength(2);
    
    // Check first product
    const firstProduct = products[0];
    expect(firstProduct.name).toEqual('Test Product 1');
    expect(firstProduct.description).toEqual('First test product');
    expect(firstProduct.price).toEqual(19.99);
    expect(firstProduct.image_url).toEqual('https://example.com/product1.jpg');
    expect(firstProduct.id).toBeDefined();
    expect(firstProduct.created_at).toBeInstanceOf(Date);
    expect(typeof firstProduct.price).toBe('number');
    
    // Check second product
    const secondProduct = products[1];
    expect(secondProduct.name).toEqual('Test Product 2');
    expect(secondProduct.description).toEqual('Second test product');
    expect(secondProduct.price).toEqual(29.99);
    expect(secondProduct.image_url).toEqual('https://example.com/product2.jpg');
    expect(secondProduct.id).toBeDefined();
    expect(secondProduct.created_at).toBeInstanceOf(Date);
    expect(typeof secondProduct.price).toBe('number');
  });

  it('should return an empty array when no products exist', async () => {
    // Clear all products
    await db.delete(productsTable).execute();
    
    const products = await getProducts();
    expect(products).toHaveLength(0);
  });
});

describe('getProductsByCategory', () => {
  let categoryId: number;
  let otherCategoryId: number;
  
  beforeEach(async () => {
    await createDB();
    
    // Create test categories
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
      
    categoryId = categoryResult[0].id;
    
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Other Category',
        slug: 'other-category',
        description: 'Another category for testing'
      })
      .returning()
      .execute();
      
    otherCategoryId = otherCategoryResult[0].id;
    
    // Create test products in first category
    await db.insert(productsTable)
      .values({
        name: 'Category Product 1',
        slug: 'category-product-1',
        description: 'First category product',
        price: '19.99',
        category_id: categoryId
      })
      .execute();
      
    await db.insert(productsTable)
      .values({
        name: 'Category Product 2',
        slug: 'category-product-2',
        description: 'Second category product',
        price: '29.99',
        category_id: categoryId
      })
      .execute();
      
    // Create test product in other category
    await db.insert(productsTable)
      .values({
        name: 'Other Category Product',
        slug: 'other-category-product',
        description: 'Product in other category',
        price: '39.99',
        category_id: otherCategoryId
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch products by category ID', async () => {
    const products = await getProductsByCategory(categoryId);

    expect(products).toHaveLength(2);
    
    products.forEach(product => {
      expect(product.category_id).toEqual(categoryId);
      expect(typeof product.price).toBe('number');
    });
    
    const productNames = products.map(p => p.name);
    expect(productNames).toContain('Category Product 1');
    expect(productNames).toContain('Category Product 2');
    expect(productNames).not.toContain('Other Category Product');
  });

  it('should return an empty array when no products exist for a category', async () => {
    // Create a new category without any products
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        slug: 'empty-category',
        description: 'Category with no products'
      })
      .returning()
      .execute();
    
    const newCategoryId = newCategoryResult[0].id;
    const products = await getProductsByCategory(newCategoryId);
    
    expect(products).toHaveLength(0);
  });
});
