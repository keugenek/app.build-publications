import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { predefinedCategoryNames } from '../schema';
import { seedPredefinedCategories } from '../handlers/seed_predefined_categories';
import { eq, inArray } from 'drizzle-orm';

describe('seedPredefinedCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create all predefined categories when none exist', async () => {
    const result = await seedPredefinedCategories();

    // Should return all predefined categories
    expect(result).toHaveLength(predefinedCategoryNames.length);

    // Verify each predefined category exists
    predefinedCategoryNames.forEach(name => {
      const category = result.find(cat => cat.name === name);
      expect(category).toBeDefined();
      expect(category!.is_predefined).toBe(true);
      expect(category!.created_at).toBeInstanceOf(Date);
      expect(category!.id).toBeDefined();
    });
  });

  it('should save predefined categories to database', async () => {
    await seedPredefinedCategories();

    // Verify all categories are in the database
    const categories = await db.select()
      .from(categoriesTable)
      .where(inArray(categoriesTable.name, [...predefinedCategoryNames]))
      .execute();

    expect(categories).toHaveLength(predefinedCategoryNames.length);

    categories.forEach(category => {
      expect(predefinedCategoryNames).toContain(category.name as any);
      expect(category.is_predefined).toBe(true);
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });

  it('should not create duplicate categories when run multiple times', async () => {
    // Run seeding twice
    await seedPredefinedCategories();
    const secondResult = await seedPredefinedCategories();

    // Should still return all predefined categories
    expect(secondResult).toHaveLength(predefinedCategoryNames.length);

    // Verify no duplicates exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    const predefinedCategories = allCategories.filter(cat => cat.is_predefined);
    expect(predefinedCategories).toHaveLength(predefinedCategoryNames.length);

    // Each predefined name should appear exactly once
    predefinedCategoryNames.forEach(name => {
      const matchingCategories = predefinedCategories.filter(cat => cat.name === name);
      expect(matchingCategories).toHaveLength(1);
    });
  });

  it('should handle partial existing categories correctly', async () => {
    // Manually create some predefined categories first
    await db.insert(categoriesTable)
      .values([
        { name: 'Food', is_predefined: true },
        { name: 'Transport', is_predefined: true }
      ])
      .execute();

    const result = await seedPredefinedCategories();

    // Should return all predefined categories
    expect(result).toHaveLength(predefinedCategoryNames.length);

    // Verify all categories exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .where(inArray(categoriesTable.name, [...predefinedCategoryNames]))
      .execute();

    expect(allCategories).toHaveLength(predefinedCategoryNames.length);

    // All should be marked as predefined
    allCategories.forEach(category => {
      expect(category.is_predefined).toBe(true);
    });
  });

  it('should handle existing non-predefined categories with same names', async () => {
    // Create a custom category with same name as predefined
    await db.insert(categoriesTable)
      .values({ name: 'Food', is_predefined: false })
      .execute();

    const result = await seedPredefinedCategories();

    // Should return the predefined categories
    expect(result).toHaveLength(predefinedCategoryNames.length);

    // Verify the Food category is still marked as non-predefined
    const foodCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, 'Food'))
      .execute();

    expect(foodCategory).toHaveLength(1);
    expect(foodCategory[0].is_predefined).toBe(false);

    // Other predefined categories should exist
    const otherPredefinedNames = predefinedCategoryNames.filter(name => name !== 'Food');
    const otherCategories = await db.select()
      .from(categoriesTable)
      .where(inArray(categoriesTable.name, otherPredefinedNames))
      .execute();

    expect(otherCategories).toHaveLength(otherPredefinedNames.length);
    otherCategories.forEach(category => {
      expect(category.is_predefined).toBe(true);
    });
  });

  it('should include all expected predefined category names', async () => {
    const result = await seedPredefinedCategories();

    const expectedCategories = ['Food', 'Transport', 'Housing', 'Entertainment', 'Utilities'];
    const resultNames = result.map(cat => cat.name).sort();
    
    expect(resultNames).toEqual(expectedCategories.sort());
  });
});
