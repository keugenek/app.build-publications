import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories from the database', async () => {
    // Insert test data
    const testCategories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Apparel and fashion items',
      },
      {
        name: 'Books',
        slug: 'books',
        description: 'Printed and digital books',
      },
    ];

    // Insert categories into database
    await db.insert(categoriesTable).values(testCategories).execute();

    // Call the handler
    const result = await getCategories();

    // Verify we got all categories back
    expect(result).toHaveLength(3);
    
    // Verify the structure and data of each category
    const electronicsCategory = result.find(c => c.name === 'Electronics');
    const clothingCategory = result.find(c => c.name === 'Clothing');
    const booksCategory = result.find(c => c.name === 'Books');

    expect(electronicsCategory).toBeDefined();
    expect(electronicsCategory!.slug).toEqual('electronics');
    expect(electronicsCategory!.description).toEqual('Electronic devices and gadgets');
    expect(electronicsCategory!.id).toBeDefined();
    expect(electronicsCategory!.created_at).toBeInstanceOf(Date);

    expect(clothingCategory).toBeDefined();
    expect(clothingCategory!.slug).toEqual('clothing');
    expect(clothingCategory!.description).toEqual('Apparel and fashion items');
    expect(clothingCategory!.id).toBeDefined();
    expect(clothingCategory!.created_at).toBeInstanceOf(Date);

    expect(booksCategory).toBeDefined();
    expect(booksCategory!.slug).toEqual('books');
    expect(booksCategory!.description).toEqual('Printed and digital books');
    expect(booksCategory!.id).toBeDefined();
    expect(booksCategory!.created_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null descriptions', async () => {
    // Insert test data with null description
    const categoryWithNullDescription = {
      name: 'Miscellaneous',
      slug: 'miscellaneous',
      description: null,
    };

    await db.insert(categoriesTable).values(categoryWithNullDescription).execute();

    // Call the handler
    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Miscellaneous');
    expect(result[0].description).toBeNull();
    expect(result[0].slug).toEqual('miscellaneous');
  });
});
