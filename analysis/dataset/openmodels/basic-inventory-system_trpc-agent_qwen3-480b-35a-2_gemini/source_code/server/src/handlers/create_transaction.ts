import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // First, verify that the product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, input.product_sku))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with SKU ${input.product_sku} not found`);
    }

    // Calculate the new stock level based on transaction type
    let newStockLevel: number;
    if (input.transaction_type === 'stock-in') {
      newStockLevel = product[0].stock_level + input.quantity;
    } else {
      newStockLevel = product[0].stock_level - input.quantity;
      // Ensure stock level doesn't go negative
      if (newStockLevel < 0) {
        throw new Error(`Insufficient stock for product ${input.product_sku}. Current stock: ${product[0].stock_level}, Requested: ${input.quantity}`);
      }
    }

    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Update product stock level
      await tx.update(productsTable)
        .set({
          stock_level: newStockLevel,
          updated_at: new Date()
        })
        .where(eq(productsTable.sku, input.product_sku))
        .execute();

      // Insert transaction record
      const result = await tx.insert(transactionsTable)
        .values({
          product_sku: input.product_sku,
          transaction_type: input.transaction_type,
          quantity: input.quantity,
          transaction_date: new Date()
        })
        .returning()
        .execute();

      return result[0];
    });
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
