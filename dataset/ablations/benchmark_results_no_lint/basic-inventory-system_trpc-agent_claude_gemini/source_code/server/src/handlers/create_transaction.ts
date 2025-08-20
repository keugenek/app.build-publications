import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    // Use database transaction to ensure consistency
    const result = await db.transaction(async (tx) => {
      // First, verify the product exists and get current stock level
      const existingProduct = await tx.select()
        .from(productsTable)
        .where(eq(productsTable.id, input.product_id))
        .execute();

      if (existingProduct.length === 0) {
        throw new Error(`Product with ID ${input.product_id} not found`);
      }

      const currentStockLevel = existingProduct[0].stock_level;

      // For stock_out transactions, validate sufficient stock exists
      if (input.type === 'stock_out' && currentStockLevel < input.quantity) {
        throw new Error(`Insufficient stock. Current stock: ${currentStockLevel}, requested: ${input.quantity}`);
      }

      // Calculate new stock level
      const newStockLevel = input.type === 'stock_in'
        ? currentStockLevel + input.quantity
        : currentStockLevel - input.quantity;

      // Create the transaction record
      const transactionResult = await tx.insert(transactionsTable)
        .values({
          product_id: input.product_id,
          type: input.type,
          quantity: input.quantity,
          notes: input.notes || null
        })
        .returning()
        .execute();

      // Update product stock level
      await tx.update(productsTable)
        .set({ 
          stock_level: newStockLevel,
          updated_at: sql`NOW()`
        })
        .where(eq(productsTable.id, input.product_id))
        .execute();

      return transactionResult[0];
    });

    return result;
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
}
