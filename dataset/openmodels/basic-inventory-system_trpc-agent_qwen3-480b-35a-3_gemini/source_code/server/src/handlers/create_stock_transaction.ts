import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type CreateStockTransactionInput, type StockTransaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createStockTransaction = async (input: CreateStockTransactionInput): Promise<StockTransaction> => {
  try {
    // Start a transaction to ensure consistency
    return await db.transaction(async (tx) => {
      // First, verify the product exists
      const product = await tx.select()
        .from(productsTable)
        .where(eq(productsTable.id, input.productId))
        .execute();

      if (product.length === 0) {
        throw new Error(`Product with ID ${input.productId} not found`);
      }

      // Calculate new stock level based on transaction type
      let newStockLevel: number;
      if (input.transactionType === 'STOCK_IN') {
        newStockLevel = product[0].stockLevel + input.quantity;
      } else {
        newStockLevel = product[0].stockLevel - input.quantity;
        // Ensure stock level doesn't go negative
        if (newStockLevel < 0) {
          throw new Error(`Insufficient stock. Current stock: ${product[0].stockLevel}`);
        }
      }

      // Update product stock level
      await tx.update(productsTable)
        .set({
          stockLevel: newStockLevel,
          updatedAt: new Date()
        })
        .where(eq(productsTable.id, input.productId))
        .execute();

      // Insert stock transaction record
      const result = await tx.insert(stockTransactionsTable)
        .values({
          productId: input.productId,
          quantity: input.quantity,
          transactionType: input.transactionType,
          transactionDate: new Date()
        })
        .returning()
        .execute();

      return result[0];
    });
  } catch (error) {
    console.error('Stock transaction creation failed:', error);
    throw error;
  }
};
