import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { asc } from 'drizzle-orm';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch all products ordered by name for better UX
    const results = await db.select()
      .from(productsTable)
      .orderBy(asc(productsTable.name))
      .execute();

    // Return the results directly - no type conversion needed for this schema
    // All fields are already in the correct format (integers, strings, dates)
    return results;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
