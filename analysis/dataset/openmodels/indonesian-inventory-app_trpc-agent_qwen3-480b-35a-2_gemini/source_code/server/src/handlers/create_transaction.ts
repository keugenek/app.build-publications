import { db } from '../db';
import { transactionsTable, itemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // First, verify that the item exists
    const existingItem = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, input.item_id))
      .execute();
    
    if (existingItem.length === 0) {
      throw new Error(`Item with id ${input.item_id} not found`);
    }

    // Start a transaction to ensure consistency
    return await db.transaction(async (tx) => {
      // Insert the transaction record
      const transactionResult = await tx.insert(transactionsTable)
        .values({
          item_id: input.item_id,
          type: input.type,
          quantity: input.quantity
        })
        .returning()
        .execute();
      
      const transaction = transactionResult[0];
      
      // Calculate new stock based on transaction type
      let newStock: number;
      if (input.type === 'in') {
        newStock = existingItem[0].stock + input.quantity;
      } else {
        // For 'out' transactions, ensure we don't go below 0
        newStock = Math.max(0, existingItem[0].stock - input.quantity);
      }
      
      // Update the item's stock
      await tx.update(itemsTable)
        .set({ 
          stock: newStock,
          updated_at: new Date()
        })
        .where(eq(itemsTable.id, input.item_id))
        .execute();
      
      return {
        id: transaction.id,
        item_id: transaction.item_id,
        type: transaction.type,
        quantity: transaction.quantity,
        created_at: transaction.created_at
      };
    });
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
