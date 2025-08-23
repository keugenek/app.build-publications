import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteSupplier = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .returning()
      .execute();
    
    // Return true if a supplier was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Supplier deletion failed:', error);
    throw error;
  }
};
