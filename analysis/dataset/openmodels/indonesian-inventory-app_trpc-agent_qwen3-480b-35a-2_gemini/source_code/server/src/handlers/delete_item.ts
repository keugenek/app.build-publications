import { db } from '../db';
import { itemsTable, transactionsTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteItem = async (input: DeleteItemInput): Promise<boolean> => {
  try {
    // First delete all transactions associated with this item
    await db.delete(transactionsTable)
      .where(eq(transactionsTable.item_id, input.id))
      .execute();
    
    // Then delete the item itself
    const result = await db.delete(itemsTable)
      .where(eq(itemsTable.id, input.id))
      .execute();
    
    // Return true if any rows were affected
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Item deletion failed:', error);
    throw error;
  }
};
