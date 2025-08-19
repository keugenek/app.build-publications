import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type CreateStockTransactionInput, type StockTransaction } from '../schema';
import { eq } from 'drizzle-orm';

export async function createStockTransaction(input: CreateStockTransactionInput): Promise<StockTransaction> {
  try {
    // First, verify the product exists and get current stock level
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    const product = existingProducts[0];
    
    // Calculate new stock level based on transaction type
    let newStockLevel = product.stock_level;
    if (input.transaction_type === 'stock_in') {
      newStockLevel += input.quantity;
    } else if (input.transaction_type === 'stock_out') {
      newStockLevel -= input.quantity;
      
      // Validate that stock doesn't go negative
      if (newStockLevel < 0) {
        throw new Error(`Insufficient stock. Current stock: ${product.stock_level}, requested: ${input.quantity}`);
      }
    }

    // Create the transaction record
    const transactionResult = await db.insert(stockTransactionsTable)
      .values({
        product_id: input.product_id,
        transaction_type: input.transaction_type,
        quantity: input.quantity,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Update the product's stock level
    await db.update(productsTable)
      .set({ 
        stock_level: newStockLevel,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, input.product_id))
      .execute();

    return transactionResult[0];
  } catch (error) {
    console.error('Stock transaction creation failed:', error);
    throw error;
  }
}
