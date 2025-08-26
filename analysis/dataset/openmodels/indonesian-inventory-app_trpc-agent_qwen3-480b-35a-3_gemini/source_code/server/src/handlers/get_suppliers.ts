import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type Supplier } from '../schema';

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const results = await db.select().from(suppliersTable).execute();
    
    // Map results to match the Zod schema type
    return results.map(supplier => ({
      ...supplier,
      created_at: supplier.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    throw error;
  }
};
