import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type Product } from '../schema';
import { getProducts } from '../handlers/get_products';
import { eq } from 'drizzle-orm';

describe('getProducts', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test category first (required for foreign key constraint)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Gaming Mice',
        description: 'Gaming mice for PC'
      })
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Create some test products
    await db.insert(productsTable)
      .values({
        name: 'Razer DeathAdder',
        description: 'High precision gaming mouse',
        price: '49.99',
        category_id: categoryId
      })
      .execute();
      
    await db.insert(productsTable)
      .values({
        name: 'Logitech G502',
        description: 'Popular gaming mouse with customizable weights',
        price: '39.99',
        category_id: categoryId
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should return all products', async () => {
    const products = await getProducts();
    
    expect(products).toHaveLength(2);
    
    // Check first product
    const firstProduct = products[0];
    expect(firstProduct.name).toEqual('Razer DeathAdder');
    expect(firstProduct.description).toEqual('High precision gaming mouse');
    expect(firstProduct.price).toEqual(49.99);
    expect(firstProduct.category_id).toBeDefined();
    expect(firstProduct.id).toBeDefined();
    expect(firstProduct.created_at).toBeInstanceOf(Date);
    expect(firstProduct.updated_at).toBeInstanceOf(Date);
    
    // Check second product
    const secondProduct = products[1];
    expect(secondProduct.name).toEqual('Logitech G502');
    expect(secondProduct.description).toEqual('Popular gaming mouse with customizable weights');
    expect(secondProduct.price).toEqual(39.99);
    expect(secondProduct.category_id).toBeDefined();
    expect(secondProduct.id).toBeDefined();
    expect(secondProduct.created_at).toBeInstanceOf(Date);
    expect(secondProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should return products with proper numeric conversion', async () => {
    const products = await getProducts();
    
    expect(products).toHaveLength(2);
    
    // Verify price is properly converted to number
    products.forEach(product => {
      expect(typeof product.price).toBe('number');
      expect(product.price).not.toBeNaN();
    });
  });

  it('should return empty array when no products exist', async () => {
    // Clear all products
    await db.delete(productsTable).execute();
    
    const products = await getProducts();
    
    expect(products).toHaveLength(0);
    expect(products).toEqual([]);
  });

  it('should handle products with null prices correctly', async () => {
    // Get the existing category
    const categories = await db.select().from(categoriesTable).execute();
    const categoryId = categories[0].id;
    
    // Create a product with null price
    await db.insert(productsTable)
      .values({
        name: 'Custom Build',
        description: 'Contact us for pricing',
        price: null,
        category_id: categoryId
      })
      .execute();
    
    const products = await getProducts();
    
    expect(products).toHaveLength(3);
    
    const customBuild = products.find(p => p.name === 'Custom Build');
    expect(customBuild).toBeDefined();
    expect(customBuild?.price).toBeNull();
  });
});
