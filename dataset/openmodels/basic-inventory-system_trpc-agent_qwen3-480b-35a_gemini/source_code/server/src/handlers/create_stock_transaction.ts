import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateStockTransactionInput, type StockTransaction } from '../schema';

export const createStockTransaction = async (input: CreateStockTransactionInput): Promise<StockTransaction> => {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // First, get the current product to check if it exists
      const existingProduct = await tx.select()
        .from(productsTable)
        .where(eq(productsTable.id, input.product_id))
        .execute();
      
      if (existingProduct.length === 0) {
        throw new Error(`Product with id ${input.product_id} not found`);
      }
      
      const product = existingProduct[0];
      
      // Calculate the new stock quantity based on transaction type
      let newStockQuantity: number;
      if (input.transaction_type === 'IN') {
        newStockQuantity = product.stock_quantity + input.quantity;
      } else {
        // For OUT transactions, ensure we don't go below 0
        newStockQuantity = Math.max(0, product.stock_quantity - input.quantity);
      }
      
      // Update the product's stock quantity
      await tx.update(productsTable)
        .set({
          stock_quantity: newStockQuantity,
          updated_at: new Date()
        })
        .where(eq(productsTable.id, input.product_id))
        .execute();
      
      // Create the stock transaction record
      const result = await tx.insert(stockTransactionsTable)
        .values({
          product_id: input.product_id,
          transaction_type: input.transaction_type,
          quantity: input.quantity,
          notes: input.notes || null
        })
        .returning()
        .execute();
      
      // Return the created transaction
      return {
        ...result[0],
        notes: result[0].notes || null
      };
    });
  } catch (error) {
    console.error('Stock transaction creation failed:', error);
    throw error;
  }
};
