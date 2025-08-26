import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { getProductsByCategory } from '../handlers/get_products_by_category';
import { eq } from 'drizzle-orm';

describe('getProductsByCategory', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test categories
    const [category1, category2] = await db.insert(categoriesTable)
      .values([
        { name: 'Gaming Mice', description: 'Gaming mice for PC' },
        { name: 'Mechanical Keyboards', description: 'Mechanical keyboards for gaming' }
      ])
      .returning()
      .execute();
    
    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Gaming Mouse Pro',
          description: 'High precision gaming mouse',
          price: '79.99',
          category_id: category1.id
        },
        {
          name: 'Wireless Gaming Mouse',
          description: 'Ergonomic wireless mouse',
          price: '59.99',
          category_id: category1.id
        },
        {
          name: 'Mechanical Keyboard RGB',
          description: 'RGB backlit mechanical keyboard',
          price: '129.99',
          category_id: category2.id
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all products for a specific category', async () => {
    // Get the first category
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Gaming Mice'))
      .execute();
    
    const categoryId = categories[0].id;
    
    // Fetch products by category
    const products = await getProductsByCategory(categoryId);
    
    // Validate results
    expect(products).toHaveLength(2);
    expect(products.every(product => product.category_id === categoryId)).toBe(true);
    
    // Validate product details
    const productNames = products.map(p => p.name);
    expect(productNames).toContain('Gaming Mouse Pro');
    expect(productNames).toContain('Wireless Gaming Mouse');
    
    // Validate price conversion
    const mousePro = products.find(p => p.name === 'Gaming Mouse Pro');
    expect(mousePro).toBeDefined();
    expect(typeof mousePro!.price).toBe('number');
    expect(mousePro!.price).toBe(79.99);
  });

  it('should return empty array when no products exist for category', async () => {
    // Use a category ID that doesn't have products
    const nonExistentCategoryId = 99999;
    const products = await getProductsByCategory(nonExistentCategoryId);
    
    expect(products).toHaveLength(0);
  });

  it('should handle categories with null price values', async () => {
    // Create a product with null price
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Gaming Mice'))
      .execute();
    
    const categoryId = categories[0].id;
    
    await db.insert(productsTable)
      .values({
        name: 'Budget Gaming Mouse',
        description: 'Affordable gaming mouse',
        price: null,
        category_id: categoryId
      })
      .execute();
    
    const products = await getProductsByCategory(categoryId);
    
    expect(products).toHaveLength(3);
    
    const budgetMouse = products.find(p => p.name === 'Budget Gaming Mouse');
    expect(budgetMouse).toBeDefined();
    expect(budgetMouse!.price).toBeNull();
  });
});
