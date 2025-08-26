import { db } from '../db';
import { customersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCustomer = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(customersTable)
      .where(eq(customersTable.id, id))
      .returning()
      .execute();
    
    return result.length > 0;
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
};
