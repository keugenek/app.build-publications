import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // First, verify the product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Insert the transaction record
      const transactionResult = await tx.insert(transactionsTable)
        .values({
          product_id: input.product_id,
          type: input.type,
          quantity: input.quantity,
          transaction_date: input.transaction_date.toISOString().split('T')[0] // Convert to date string
        })
        .returning()
        .execute();

      const newTransaction = transactionResult[0];

      // Update product stock quantity based on transaction type
      let newStockQuantity: number;
      if (input.type === 'masuk') {
        // Stock in - increase quantity
        newStockQuantity = existingProduct[0].stock_quantity + input.quantity;
      } else {
        // Stock out - decrease quantity
        newStockQuantity = existingProduct[0].stock_quantity - input.quantity;
        
        // Ensure stock doesn't go negative
        if (newStockQuantity < 0) {
          throw new Error(`Insufficient stock. Current stock: ${existingProduct[0].stock_quantity}, requested: ${input.quantity}`);
        }
      }

      // Update the product's stock quantity
      await tx.update(productsTable)
        .set({
          stock_quantity: newStockQuantity,
          updated_at: new Date()
        })
        .where(eq(productsTable.id, input.product_id))
        .execute();

      return {
        ...newTransaction,
        transaction_date: typeof newTransaction.transaction_date === 'string' 
          ? new Date(newTransaction.transaction_date) 
          : newTransaction.transaction_date,
        created_at: typeof newTransaction.created_at === 'string' 
          ? new Date(newTransaction.created_at) 
          : newTransaction.created_at
      };
    });
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};