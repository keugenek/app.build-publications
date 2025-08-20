import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category, predefinedCategoryNames } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const seedPredefinedCategories = async (): Promise<Category[]> => {
  try {
    // First, check which predefined categories already exist
    const existingCategories = await db.select()
      .from(categoriesTable)
      .where(inArray(categoriesTable.name, [...predefinedCategoryNames]))
      .execute();

    const existingCategoryNames = existingCategories.map(cat => cat.name);
    
    // Filter out categories that already exist
    const categoriesToCreate = predefinedCategoryNames.filter(
      name => !existingCategoryNames.includes(name)
    );

    let newCategories: Category[] = [];

    // Only insert categories that don't already exist
    if (categoriesToCreate.length > 0) {
      const insertValues = categoriesToCreate.map(name => ({
        name,
        is_predefined: true
      }));

      const insertedCategories = await db.insert(categoriesTable)
        .values(insertValues)
        .returning()
        .execute();

      newCategories = insertedCategories;
    }

    // Return all predefined categories (existing + newly created)
    const allPredefinedCategories = await db.select()
      .from(categoriesTable)
      .where(inArray(categoriesTable.name, [...predefinedCategoryNames]))
      .execute();

    return allPredefinedCategories;
  } catch (error) {
    console.error('Seeding predefined categories failed:', error);
    throw error;
  }
};
