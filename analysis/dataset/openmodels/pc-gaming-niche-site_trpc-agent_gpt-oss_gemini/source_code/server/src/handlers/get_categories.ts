import { type Category } from '../schema';
import { db } from '../db';
import { categoriesTable } from '../db/schema';

/**
 * Stub handler to fetch all categories.
 * Real implementation should query the `categories` table.
 */
export const getCategories = async (): Promise<Category[]> => {
  return await db.select().from(categoriesTable).execute();
};
