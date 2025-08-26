import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Supplier } from '../schema';

export const getSupplier = async (id: number): Promise<Supplier | null> => {
  try {
    const result = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const supplier = result[0];
    return {
      ...supplier,
      created_at: new Date(supplier.created_at)
    };
  } catch (error) {
    console.error('Get supplier failed:', error);
    throw error;
  }
};
